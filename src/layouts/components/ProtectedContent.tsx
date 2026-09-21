import React, { useEffect, useState } from "react";
import { FaLock, FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import {
  decryptContent,
  decryptWithJwt,
  createPostJwt,
  PostCookie,
  type EncryptedPayload,
} from "@/lib/utils/crypto";

interface ProtectedContentProps {
  payload: EncryptedPayload;
  postSlug: string;
}

const ProtectedContent: React.FC<ProtectedContentProps> = ({
  payload,
  postSlug,
}) => {
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Check saved JWT cookie on initial render
  useEffect(() => {
    const savedJwt = PostCookie.get(postSlug);
    if (savedJwt) {
      decryptWithJwt(payload, savedJwt, postSlug)
        .then((decrypted) => {
          setHtmlContent(decrypted);
          setIsUnlocked(true);
        })
        .catch(() => {
          // If saved token is expired or invalid, remove it
          PostCookie.remove(postSlug);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [postSlug, payload]);

  const handleUnlock = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!password.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const decrypted = await decryptContent(payload, password.trim());
      if (remember) {
        // Issue signed JWT with derived key (NO plaintext password in cookie!)
        const jwt = await createPostJwt(postSlug, password.trim(), payload, 7);
        PostCookie.set(postSlug, jwt, 7); // Valid for 7 days
      } else {
        PostCookie.remove(postSlug);
      }
      setHtmlContent(decrypted);
      setIsUnlocked(true);
    } catch {
      setError("비밀번호가 일치하지 않습니다. 다시 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLockAgain = () => {
    PostCookie.remove(postSlug);
    setIsUnlocked(false);
    setHtmlContent("");
    setPassword("");
    setError(null);
  };

  // 1. Initial checking state (prevents UI flicker if valid cookie exists)
  if (loading) {
    return (
      <div className="my-12 flex flex-col items-center justify-center p-12 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent dark:border-darkmode-primary dark:border-t-transparent mb-3" />
        <p className="text-sm text-text-light dark:text-darkmode-text-light">
          인증 상태 확인 중...
        </p>
      </div>
    );
  }

  // 2. Unlocked state
  if (isUnlocked) {
    return (
      <div className="transition-all duration-300">
        <div
          className="content mb-10"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
        <div className="mt-8 flex justify-end border-t border-border pt-4 dark:border-darkmode-border">
          <button
            type="button"
            onClick={handleLockAgain}
            className="flex items-center gap-1.5 text-xs text-text-light hover:text-red-500 dark:text-darkmode-text-light dark:hover:text-red-400 transition cursor-pointer"
            title="저장된 비밀번호 쿠키를 삭제하고 글을 다시 잠급니다."
          >
            <FaLock className="inline-block" />
            <span>다시 잠그기 (쿠키 삭제)</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Locked state
  return (
    <div className="mx-auto my-12 max-w-lg rounded-xl border border-border bg-light p-8 text-center shadow-sm dark:border-darkmode-border dark:bg-darkmode-light md:p-10">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary dark:bg-darkmode-primary/20 dark:text-darkmode-primary">
        <FaLock />
      </div>

      <h3 className="h4 mb-2 text-text-dark dark:text-darkmode-text-dark">
        비밀번호로 보호된 글입니다
      </h3>
      <p className="mb-6 text-sm text-text-light dark:text-darkmode-text-light">
        이 글을 열람하려면 설정된 비밀번호를 입력해 주세요.
      </p>

      <form onSubmit={handleUnlock} className="text-left">
        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="비밀번호 입력"
            className="w-full rounded border border-border bg-white px-4 py-2.5 pr-11 text-text-dark outline-none transition focus:border-primary dark:border-darkmode-border dark:bg-darkmode-body dark:text-darkmode-text-dark dark:focus:border-darkmode-primary"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark dark:text-darkmode-text-light dark:hover:text-darkmode-text-dark transition cursor-pointer p-1"
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
          >
            {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
            {error}
          </div>
        )}

        <label className="mb-5 flex cursor-pointer items-center select-none text-xs text-text-light dark:text-darkmode-text-light">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="mr-2 h-4 w-4 rounded border-border text-primary focus:ring-0 dark:border-darkmode-border dark:bg-darkmode-body"
          />
          <span>
            이 브라우저에서 비밀번호 기억하기 (쿠키 저장 - 7일간 유지)
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting || !password.trim()}
          className="btn btn-primary w-full py-2.5 text-center font-medium disabled:opacity-50 transition cursor-pointer"
        >
          {submitting ? "복호화 확인 중..." : "글 열람하기"}
        </button>
      </form>
    </div>
  );
};

export default ProtectedContent;
