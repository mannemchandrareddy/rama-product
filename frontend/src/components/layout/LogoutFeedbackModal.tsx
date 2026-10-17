'use client';

import { useState } from 'react';
import { Star, X, MessageSquareHeart, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils';

interface LogoutFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const FEEDBACK_TAGS = [
  '🛍️ Found products easily',
  '💰 Saved money on prices',
  '📍 Accurate store distance',
  '⚡ Fast & responsive app',
  '🏪 Need more local shops',
  '💬 Quick WhatsApp order',
  '📦 Stock details helpful',
];

const STAR_LABELS = [
  '',
  'Could be better 😕',
  'Fair experience 😐',
  'Good app 🙂',
  'Very satisfied! 😊',
  'Exceptional & loved it! 🌟',
];

export default function LogoutFeedbackModal({ isOpen, onClose, onSuccess }: LogoutFeedbackModalProps) {
  const { user, signOut, submitFeedback } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['🛍️ Found products easily', '📍 Accurate store distance']);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleConfirmLogout = async (includeFeedback: boolean) => {
    setIsSubmitting(true);
    try {
      if (includeFeedback) {
        await submitFeedback(rating, selectedTags, comment);
      }
      setSubmitted(true);
      setTimeout(async () => {
        await signOut();
        setIsSubmitting(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } catch {
      await signOut();
      setIsSubmitting(false);
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl bg-white border border-[#e4e4e7] shadow-2xl p-6 sm:p-7 relative overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-[#0a0a0a]">Thank You!</h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Your feedback helps make LocalMart better for shoppers and local merchants. Signing out safely...
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="text-left space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-bold">
                <MessageSquareHeart className="w-3.5 h-3.5" />
                <span>Leaving so soon?</span>
              </div>
              <h2 className="text-xl font-extrabold text-[#0a0a0a] tracking-tight">
                Sign out of {user?.name || 'LocalMart'}?
              </h2>
              <p className="text-xs text-[#71717a]">
                Help us improve your neighborhood shopping experience before you go!
              </p>
            </div>

            {/* Star Rating */}
            <div className="p-4 rounded-2xl bg-[#fafafc] border border-[#f4f4f5] text-center space-y-2">
              <span className="text-xs font-bold text-neutral-600">Rate your experience today</span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeStar = hoverRating || rating;
                  const isFilled = star <= activeStar;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={cn(
                          'w-7 h-7 transition-colors',
                          isFilled
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-300'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-extrabold text-orange-600 h-4">
                {STAR_LABELS[hoverRating || rating]}
              </p>
            </div>

            {/* Quick Feedback Chips */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 block">
                What went well or could be better?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FEEDBACK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer',
                        isSelected
                          ? 'bg-orange-50 border-orange-300 text-orange-800 font-bold'
                          : 'bg-white border-[#e4e4e7] text-neutral-600 hover:bg-neutral-50'
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Comment */}
            <div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Any suggestion for stores or products in your area? (Optional)"
                className="w-full p-3 rounded-xl border border-[#e4e4e7] text-xs text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:border-orange-500 resize-none h-16 transition-all"
                maxLength={400}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleConfirmLogout(true)}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-tr from-[#ff5e00] to-[#ff7a29] text-white font-bold text-xs shadow-md hover:shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Signing out...' : 'Submit Feedback & Sign Out'}</span>
              </button>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-1/2 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer"
                >
                  Stay Signed In
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmLogout(false)}
                  disabled={isSubmitting}
                  className="w-1/2 py-2 text-xs font-semibold text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                >
                  Skip & Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
