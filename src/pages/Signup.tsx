import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../lib/api";
export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signup(name, email, password);
      navigate("/login");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "회원가입에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#f4f6f3] min-[900px]:grid-cols-[minmax(320px,0.9fr)_minmax(420px,1.1fr)]">
      <section className="flex flex-col justify-center bg-[#18252d] p-[clamp(28px,5vw,80px)] text-[#f4f6f3] max-[899px]:min-h-[340px] max-[899px]:px-6 max-[899px]:py-10">
        <span className="mb-5 grid size-12 place-items-center rounded-full bg-[#d8f36b] text-2xl font-extrabold text-[#18252d]">
          W
        </span>
        <strong className="font-mono text-sm font-medium uppercase tracking-[0.08em]">
          workly / agent
        </strong>
        <p className="my-10 max-w-[480px] text-[clamp(30px,3.6vw,46px)] font-bold leading-[1.18] max-[899px]:my-7">
          계정을 만들고,
          <br />
          팀의 프로젝트를
          <br />
          함께 관리하세요.
        </p>
        <div className="max-w-[440px] border-l-2 border-[#d8f36b] pl-4 text-sm leading-[1.7] text-[#b9c4c7]">
          새 팀을 만들거나 초대받은 팀에 참여해
          <br />
          프로젝트 업무를 함께 관리하세요.
        </div>
      </section>
      <section className="grid place-items-center p-[clamp(28px,6vw,88px)] max-[899px]:px-6 max-[899px]:py-12">
        <form
          className="w-full max-w-[460px]"
          aria-labelledby="signup-title"
          onSubmit={handleSubmit}
        >
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.08em] text-[#647278]">
            개인 계정 만들기
          </p>
          <h1
            id="signup-title"
            className="text-[clamp(30px,4vw,46px)] font-bold leading-[1.1] text-[#18252d]"
          >
            팀과 함께 시작해보세요.
          </h1>
          <p className="my-4 mb-9 leading-[1.6] text-[#647278]">
            가입 후 새 팀을 만들거나 초대받은 팀에 참여할 수 있습니다.
          </p>
          {error && (
            <p className="mb-4 rounded-md bg-[#fff1f0] px-4 py-3 text-sm text-[#b42318]">
              {error}
            </p>
          )}
          <label
            className="mt-5 grid gap-2 text-[13px] font-bold text-[#304047]"
            htmlFor="name"
          >
            이름
            <input
              className="w-full rounded-md border border-[#cbd4d1] bg-white px-4 py-3.5 font-normal text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
              id="name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              type="text"
              autoComplete="name"
              placeholder="Sarah Choi"
              required
            />
          </label>
          <label
            className="mt-5 grid gap-2 text-[13px] font-bold text-[#304047]"
            htmlFor="email"
          >
            이메일
            <input
              className="w-full rounded-md border border-[#cbd4d1] bg-white px-4 py-3.5 font-normal text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
              id="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              required
            />
          </label>
          <label
            className="mt-5 grid gap-2 text-[13px] font-bold text-[#304047]"
            htmlFor="password"
          >
            비밀번호
            <input
              className="w-full rounded-md border border-[#cbd4d1] bg-white px-4 py-3.5 font-normal text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
              id="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="8자 이상 입력하세요"
              minLength={8}
              required
            />
          </label>
          <label className="mt-5 flex items-center gap-2 text-[13px] leading-[1.4] text-[#647278]">
            <input
              className="accent-[#657f51]"
              name="terms"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              type="checkbox"
              required
            />{" "}
            서비스 이용약관과 개인정보 처리방침에 동의합니다.
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-7 w-full rounded-md bg-[#18252d] px-5 py-[15px] font-bold text-[#f4f6f3] transition hover:-translate-y-px hover:bg-[#304047]"
          >
            {isSubmitting ? "가입 중..." : "개인 계정 만들기 →"}
          </button>
          <p className="mt-6 text-center text-[13px] text-[#647278]">
            이미 계정이 있나요?{" "}
            <Link className="font-bold text-[#657f51]" to="/login">
              로그인
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
