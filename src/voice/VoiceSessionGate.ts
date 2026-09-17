export class VoiceSessionGate {
  private generation = 0;
  private activeGeneration: number | null = null;
  private ended = true;

  begin(): number | null {
    if (!this.ended) return null;
    this.generation += 1;
    this.activeGeneration = this.generation;
    this.ended = false;
    return this.generation;
  }

  isActive(): boolean {
    return this.activeGeneration !== null && !this.ended;
  }

  end(): number | null {
    if (this.activeGeneration === null) return null;
    const endedGeneration = this.activeGeneration;
    this.activeGeneration = null;
    this.ended = true;
    return endedGeneration;
  }
}
