import { DEMO_TTL_HOURS, DEMO_UPSTREAM_URL } from "@/lib/demo";

/** Pinned above every dashboard page on the demo instance. */
export default function DemoBanner() {
  return (
    <div className="sticky top-0 z-30 border-b border-amber-200/70 bg-amber-50/90 px-4 py-2 text-center text-xs leading-relaxed text-amber-900 backdrop-blur md:text-[13px]">
      <span className="font-bold">演示站</span>
      <span className="mx-2 text-amber-300">|</span>
      每位访客独立沙盒，可随意增删改，{DEMO_TTL_HOURS} 小时后自动清除
      <span className="mx-2 text-amber-300">|</span>
      原项目{" "}
      <a
        href={DEMO_UPSTREAM_URL}
        target="_blank"
        rel="noreferrer"
        className="font-semibold underline underline-offset-2 hover:text-amber-700"
      >
        CoisiniIce/ReCode
      </a>
      ，仅作个人学习展示，无商业用途，如有侵权请联系下架
    </div>
  );
}
