'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { saveQuestionAction } from '@/actions/questions';

import { EditorHeader } from './editor/EditorHeader';
import { SolutionList } from './editor/SolutionList';
import { MetaSidebar } from './editor/MetaSidebar';
import {
  EditorFormData,
  QuestionEditorProps,
  SolutionsUpdate,
} from '@/types/editor';

// Tags are stored comma-joined, so commas (and their Chinese forms) separate
// tags rather than belong to one
const splitTags = (text: string) =>
  text
    .split(/[,，、]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

const mergeTags = (tags: string[], draft: string) => {
  const merged = [...tags];
  for (const tag of splitTags(draft)) {
    if (!merged.includes(tag)) merged.push(tag);
  }
  return merged;
};

export default function QuestionEditor({
  mode = 'create',
  initialData,
  preferredLang = 'typescript',
}: QuestionEditorProps) {
  const router = useRouter();

  // for Create
  const EMPTY_DATA: EditorFormData = {
    pid: '',
    title: '',
    difficulty: 'Medium',
    tags: [],
    link: '',
    solutions: [],
    masteryLevel: 0,
  };

  const startData: EditorFormData = {
    ...EMPTY_DATA,
    ...(initialData || {}),
    difficulty: initialData?.difficulty || 'Medium',
  };
  const [formData, setFormData] = useState<EditorFormData>(startData);
  const [isSaving, setIsSaving] = useState(false);
  // Text typed in the tag box that has not become a tag yet
  const [tagDraft, setTagDraft] = useState('');

  const handleUpdate = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.pid || !formData.title) {
      toast.error('Please fill in Question ID and Title');
      return;
    }

    setIsSaving(true);

    // Whatever is still sitting in the tag box counts too, so a tag typed
    // without pressing Enter is not silently dropped
    const tags = mergeTags(formData.tags, tagDraft);
    setFormData((prev) => ({ ...prev, tags }));
    setTagDraft('');

    try {
      const result = await saveQuestionAction({ ...formData, tags });

      if (result.success) {
        toast.success(
          mode === 'create' ? 'Problem created!' : 'Changes saved!',
        );
        router.push('/questions');
      } else {
        toast.error(result.error || 'Something went wrong.');
      }
    } catch (error) {
      toast.error('Network error. Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Turns the draft into tags (it may hold several, separated by commas)
  const commitTagDraft = () => {
    if (!tagDraft.trim()) return;
    setFormData((prev) => ({ ...prev, tags: mergeTags(prev.tags, tagDraft) }));
    setTagDraft('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleUpdate(
      'tags',
      formData.tags.filter((tag) => tag !== tagToRemove),
    );
  };

  return (
    <div className="relative min-h-screen w-full pb-20">
      {/* bg texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 flex flex-col gap-6 p-4 md:p-6 max-w-[1600px] mx-auto w-full">
        <EditorHeader
          pid={formData.pid}
          title={formData.title}
          mode={mode}
          isSaving={isSaving}
          onUpdate={handleUpdate}
          onSave={handleSave}
          onCancel={handleCancel}
        />

        <div className="flex flex-col gap-6">
          <MetaSidebar
            difficulty={formData.difficulty}
            tags={formData.tags}
            link={formData.link}
            masteryLevel={formData.masteryLevel}
            onUpdate={handleUpdate}
            tagDraft={tagDraft}
            onTagDraftChange={setTagDraft}
            onCommitTags={commitTagDraft}
            onRemoveTag={handleRemoveTag}
          />

          <SolutionList
            solutions={formData.solutions}
            preferredLang={preferredLang}
            problemLink={formData.link}
            onChange={(update: SolutionsUpdate) =>
              setFormData((prev) => ({
                ...prev,
                solutions:
                  typeof update === 'function'
                    ? update(prev.solutions)
                    : update,
              }))
            }
          />
        </div>
      </div>
    </div>
  );
}
