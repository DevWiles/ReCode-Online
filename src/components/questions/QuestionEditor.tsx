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

  const handleUpdate = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.pid || !formData.title) {
      toast.error('Please fill in Question ID and Title');
      return;
    }

    setIsSaving(true);

    try {
      const result = await saveQuestionAction(formData);

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

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      handleUpdate('tags', [...formData.tags, trimmedTag]);
    }
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
            onAddTag={handleAddTag}
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
