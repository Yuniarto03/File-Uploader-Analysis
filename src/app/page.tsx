
import DataSphereApp from '@/components/DataSphereApp';
import DigitalClock from '@/components/DigitalClock'; // Import the clock

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full">
      <header className="mb-12 text-center w-full">
        <div className="flex justify-between items-center w-full px-4">
          <div className="flex-1"></div> {/* Spacer to help center title */}
          <div className="flex-1 text-center">
            <h1 className="text-5xl font-tech glow-text text-primary">
              Data<span className="text-accent">Sphere</span>
            </h1>
            <p className="text-xl text-foreground/80 mt-2">Quantum MasJun Insights Analytics</p>
          </div>
          <div className="flex-1 flex justify-end">
             <DigitalClock />
          </div>
        </div>
      </header>
      <DataSphereApp />
    </div>
  );
}
