'use client';

interface Props {
  question: string;
  onAnswer: (answer: boolean) => void;
}

export default function QuestionStep({ question, onAnswer }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-2xl font-bold text-gray-900 leading-snug">{question}</p>
      <div className="flex flex-col gap-4">
        <button
          onClick={() => onAnswer(true)}
          className="w-full rounded-xl bg-green-600 py-6 text-2xl font-bold text-white transition hover:bg-green-700 active:scale-95"
        >
          Yes
        </button>
        <button
          onClick={() => onAnswer(false)}
          className="w-full rounded-xl bg-red-500 py-6 text-2xl font-bold text-white transition hover:bg-red-600 active:scale-95"
        >
          No
        </button>
      </div>
    </div>
  );
}
