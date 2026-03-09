import { useState } from 'react'
import { X, Sparkles, Copy, Check, Loader2 } from 'lucide-react'

interface SummaryModalProps {
    isOpen: boolean
    onClose: () => void
    summary: string
    loading: boolean
}

export function SummaryModal({ isOpen, onClose, summary, loading }: SummaryModalProps) {
    const [copied, setCopied] = useState(false)

    if (!isOpen) return null

    const handleCopy = async () => {
        await navigator.clipboard.writeText(summary)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-primary-50">
                    <div className="flex items-center gap-2 text-primary-700 font-bold">
                        <Sparkles size={20} className="text-primary-500" />
                        <span>AI Video Özeti</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 size={40} className="text-primary-500 animate-spin" />
                            <p className="text-slate-500 font-medium animate-pulse">Video analiz ediliyor ve özetleniyor...</p>
                        </div>
                    ) : (
                        <div className="prose prose-slate max-w-none">
                            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm md:text-base">
                                {summary || "Özet oluşturulamadı."}
                            </div>
                        </div>
                    )}
                </div>

                {!loading && summary && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
                        >
                            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                            {copied ? 'Kopyalandı!' : 'Özeti Kopyala'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
