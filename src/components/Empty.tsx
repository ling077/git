import { BookOpen } from 'lucide-react';

interface EmptyProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function Empty({ title, description, icon }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        {icon || <BookOpen className="w-8 h-8 text-slate-400" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-slate-500 max-w-sm">{description}</p>
      )}
    </div>
  );
}