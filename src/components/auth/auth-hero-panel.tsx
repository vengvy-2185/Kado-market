import Image from "next/image";

export function AuthHeroPanel() {
  return (
    <div className="relative hidden w-1/2 flex-shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 via-background to-highlight/10 px-8 py-16 lg:flex">
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-highlight/20 blur-3xl" />
      <div className="relative z-10 animate-float">
        <Image
          src="/auth-hero.png"
          alt="Welcome to KADO MARKET — Shop Smarter, Live Better"
          width={480}
          height={720}
          className="max-h-[65vh] w-auto drop-shadow-2xl"
          priority
        />
      </div>
    </div>
  );
}
