// TreatmentPlantManager.js — Water Quality & Sewage Treatment System
// Non-destructive extension: isolated contamination handling

export class TreatmentPlantManager {
  constructor() {
    this.plant = {
      id: "TP1",
      name: "Treatment Plant Alpha",
      status: "idle", // idle, processing, completed
      inputFlow: 0,
      outputFlow: 0,
      efficiency: 0.9,
      processingTime: 3, // ticks
      currentLoad: 0,
      contaminationLevel: 0,
      processedVolume: 0,
      startTime: null,
      completedTreated: 0,
    };

    this.treatmentLogs = [];
  }

  // Process contaminated water through treatment
  process(contaminatedFlow, contaminationLevel = 1) {
    this.plant.status = "processing";
    this.plant.inputFlow = contaminatedFlow;
    this.plant.contaminationLevel = contaminationLevel;
    this.plant.currentLoad = contaminatedFlow;
    this.plant.startTime = Date.now();

    const treated = contaminatedFlow * this.plant.efficiency;
    this.plant.outputFlow = treated;
    this.plant.completedTreated = treated;

    this.treatmentLogs.push({
      timestamp: Date.now(),
      inputFlow: contaminatedFlow,
      outputFlow: treated,
      contaminationLevel,
      efficiency: this.plant.efficiency,
    });

    return treated;
  }

  // Mark processing complete
  complete() {
    this.plant.status = "completed";
    this.plant.processedVolume += this.plant.completedTreated;
  }

  // Reset for next cycle
  reset() {
    this.plant.status = "idle";
    this.plant.inputFlow = 0;
    this.plant.outputFlow = 0;
    this.plant.currentLoad = 0;
    this.plant.contaminationLevel = 0;
    this.plant.startTime = null;
    this.plant.completedTreated = 0;
  }

  getStatus() {
    return this.plant;
  }

  getLogs() {
    return this.treatmentLogs;
  }

  clearLogs() {
    this.treatmentLogs = [];
  }
}

export const treatmentPlantManager = new TreatmentPlantManager();
