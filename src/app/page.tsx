import { DosageCalculator } from "@/components/dosage-calculator";

export default function Home() {
  return (
    <div className="container mx-auto p-4 py-8 md:p-12">
      <div className="mx-auto max-w-2xl">
        <DosageCalculator />
      </div>
    </div>
  );
}
