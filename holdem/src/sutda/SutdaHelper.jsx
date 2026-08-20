import { BookOpen } from 'lucide-react'

export default function SutdaHelper() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-emerald-400/12 bg-felt-950/60 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-emerald-100/40">
        <BookOpen className="h-3.5 w-3.5" />
        족보 도우미
      </div>
      <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-3">
        {/* 광땡 */}
        <div>
          <div className="font-bold text-brass-400 mb-0.5">광땡</div>
          <div className="text-emerald-50/80">38광땡 <span className="text-emerald-100/40 pl-1">(무적)</span></div>
          <div className="text-emerald-50/80">13, 18광땡</div>
        </div>
        
        {/* 땡 */}
        <div>
          <div className="font-bold text-brass-400 mb-0.5">땡</div>
          <div className="text-emerald-50/80">장땡 (10+10) <span className="text-emerald-100/40 pl-1">(땡잡이 면역)</span></div>
          <div className="text-emerald-50/80">9땡 ~ 1땡</div>
        </div>
        
        {/* 중간족보 */}
        <div>
          <div className="font-bold text-sky-300 mb-0.5">중간족보</div>
          <div className="text-emerald-50/80 flex justify-between"><span>알리</span><span className="text-emerald-100/40">1+2</span></div>
          <div className="text-emerald-50/80 flex justify-between"><span>독사</span><span className="text-emerald-100/40">1+4</span></div>
          <div className="text-emerald-50/80 flex justify-between"><span>구삥</span><span className="text-emerald-100/40">1+9</span></div>
          <div className="text-emerald-50/80 flex justify-between"><span>장삥</span><span className="text-emerald-100/40">1+10</span></div>
          <div className="text-emerald-50/80 flex justify-between"><span>장사</span><span className="text-emerald-100/40">4+10</span></div>
          <div className="text-emerald-50/80 flex justify-between"><span>세륙</span><span className="text-emerald-100/40">4+6</span></div>
        </div>

        {/* 끗 */}
        <div>
          <div className="font-bold text-emerald-200/60 mb-0.5">끗 (합산의 1의 자리)</div>
          <div className="text-emerald-50/80">갑오 (9끗) ~ 1끗</div>
          <div className="text-emerald-50/80">망통 (0끗)</div>
        </div>

        {/* 특수패 */}
        <div className="pt-1 border-t border-emerald-400/10">
          <div className="font-bold text-amber-300 mb-0.5">특수패 (조커)</div>
          <div className="text-emerald-50/80">
            <span className="text-amber-200/90">땡잡이 (3광+7)</span>
            <br />
            <span className="text-emerald-100/60 leading-tight block mt-0.5">1~9땡을 잡고 승격됨</span>
          </div>
          <div className="text-emerald-50/80 mt-1.5">
            <span className="text-amber-200/90">암행어사 (4+7)</span>
            <br />
            <span className="text-emerald-100/60 leading-tight block mt-0.5">13, 18광땡을 잡고 승격됨</span>
          </div>
          <div className="text-emerald-50/80 mt-1.5">
            <span className="text-amber-200/90">구사 (4+9)</span>
            <br />
            <span className="text-emerald-100/60 leading-tight block mt-0.5">최고패가 알리 이하일 때 재경기</span>
          </div>
        </div>
      </div>
    </div>
  )
}
