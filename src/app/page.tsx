import DataSphereApp from '@/components/DataSphereApp';

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-tech glow-text text-primary">
          Data<span className="text-accent">Sphere</span>
        </h1>
        <p className="text-xl text-foreground/80 mt-2">Quantum MasJun Insights Analytics</p>
      </header>
      <DataSphereApp />
    </div>
  );
}
