'use client';

interface Props {
  question: string;
  onAnswer: (answer: boolean) => void;
}

export default function QuestionStep({ question, onAnswer }: Props) {
  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <p className="text-xl font-bold text-[var(--foreground)] leading-snug">{question}</p>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => onAnswer(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-5 rounded-xl text-lg font-bold text-white bg-gradient-to-r from-[var(--success)] to-[#15803d] hover:from-[#15803d] hover:to-[#166534] transition-all shadow-sm active:scale-[0.98]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Yes
        </button>
        <button
          onClick={() => onAnswer(false)}
          className="w-full flex items-center justify-center gap-2 px-4 py-5 rounded-xl text-lg font-bold text-white bg-gradient-to-r from-[#f2555a] to-[#e04449] hover:from-[#e04449] hover:to-[#cc3c42] transition-all shadow-sm active:scale-[0.98]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          No
        </button>
      </div>
    </div>
  );
}
