export type StateCode = "FL" | "GA";

export type CountyRecord = {
  fips: string;
  county: string;
  state: StateCode;
  region: string;
  metroStatus: "Metro" | "Non-metro";
  sizeBucket: "Small" | "Medium" | "Large";
  year: number;
  provisional: boolean;
  totalPopulation: number;
  totalBirths: number;
  crudeBirthRate: number;
  fertilityRate: number | null;
  birthsChange1y: number;
  birthsChange5y: number;
  birthsChange10y: number;
  under5Population: number;
  schoolAgePopulation: number;
  netDomesticMigration: number;
  populationGrowthRate: number;
  enrollmentTotal: number;
  enrollmentChange5y: number;
  kindergartenEnrollment: number | null;
  kindergartenChange5y: number | null;
};

export type ScoreWeights = {
  birthTrend: number;
  crudeBirthRate: number;
  under5Share: number;
  netMigration: number;
  enrollmentTrend: number;
};
