import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../lib/api";
import { useSessionStore } from "../stores/sessionStore";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setUser = useSessionStore((state) => state.setUser);
  const setAccessToken = useSessionStore((state) => state.setAccessToken);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      setAccessToken(result.token);
      setUser({
        name: result.name,
        initials: result.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      });
      navigate("/");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "로그인에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#f4f6f3] min-[761px]:grid-cols-[minmax(320px,0.9fr)_minmax(420px,1.1fr)]">
      <section className="flex flex-col justify-center bg-[#18252d] p-[clamp(40px,8vw,120px)] text-[#f4f6f3] max-[760px]:min-h-[360px] max-[760px]:px-6 max-[760px]:py-10">
        <span className="mb-5 grid size-12 place-items-center rounded-full bg-[#d8f36b] text-2xl font-extrabold text-[#18252d]">
          W
        </span>
        <strong className="font-mono text-sm font-medium uppercase tracking-[0.08em]">
          workly / agent
        </strong>
        <p className="my-[52px] max-w-[420px] text-[clamp(28px,3.5vw,52px)] font-bold leading-[1.12] max-[760px]:my-8 max-[760px]:text-[34px]">
          팀의 계획을 더 선명하게,
          <br />
          실행을 더 빠르게.
        </p>
        <div className="max-w-[420px] border-l-2 border-[#d8f36b] pl-4 text-sm leading-[1.7] text-[#b9c4c7]">
          “프로젝트 요구사항에서 실행 가능한 인력 배정까지, 한 화면에서
          시작하세요.”
        </div>
      </section>
      <section className="grid place-items-center p-[clamp(32px,8vw,120px)] max-[760px]:px-6 max-[760px]:py-14 max-[760px]:pb-[72px]">
        <form className="w-full max-w-[460px]" onSubmit={handleSubmit}>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.08em] text-[#647278]">
            워크스페이스 로그인
          </p>
          <h1 className="text-[clamp(30px,4vw,46px)] font-bold leading-[1.1] text-[#18252d]">
            다시 만나서 반가워요.
          </h1>
          <p className="my-4 mb-9 leading-[1.6] text-[#647278]">
            Workly 워크스페이스에 로그인하세요.
          </p>
          {error && (
            <p className="mb-4 rounded-md bg-[#fff1f0] px-4 py-3 text-sm text-[#b42318]">
              {error}
            </p>
          )}
          <label className="mt-5 grid gap-2 text-[13px] font-bold text-[#304047]">
            이메일
            <input
              className="w-full rounded-md border border-[#cbd4d1] bg-white px-4 py-3.5 font-normal text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="name@company.com"
              required
            />
          </label>
          <label className="mt-5 grid gap-2 text-[13px] font-bold text-[#304047]">
            비밀번호
            <input
              className="w-full rounded-md border border-[#cbd4d1] bg-white px-4 py-3.5 font-normal text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </label>
          <div className="my-5 mb-7 flex items-center justify-between gap-4 max-[420px]:items-start max-[420px]:flex-col">
            <label className="flex items-center gap-2 text-[13px] leading-[1.4] text-[#647278]">
              <input
                className="accent-[#657f51]"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                type="checkbox"
              />
              로그인 상태 유지
            </label>
            <button
              type="button"
              className="p-0 text-[13px] font-bold text-[#657f51]"
            >
              비밀번호 찾기
            </button>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[#18252d] px-5 py-[15px] font-bold text-[#f4f6f3] transition hover:-translate-y-px hover:bg-[#304047]"
          >
            {isSubmitting ? "로그인 중..." : "로그인 →"}
          </button>
          <p className="mt-6 text-center text-[13px] text-[#647278]">
            아직 계정이 없나요?{" "}
            <Link className="font-bold text-[#657f51]" to="/signup">
              회원가입
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
