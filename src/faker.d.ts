// Ambient declarations for the two-go faker module: a tiny fake data generator.

export interface FakerNumberOptions {
  min?: number;
  max?: number;
}

export interface FakerDateOptions {
  from?: Date;
  to?: Date;
}

export interface Faker {
  uuid(): string;
  email(): string;
  firstName(): string;
  lastName(): string;
  fullName(): string;
  username(): string;
  word(): string;
  words(n?: number): string;
  sentence(n?: number): string;
  paragraph(n?: number): string;
  number(options?: FakerNumberOptions): number;
  int(min?: number, max?: number): number;
  float(min?: number, max?: number, decimals?: number): number;
  boolean(): boolean;
  pick<T>(array: T[]): T | undefined;
  pickMany<T>(array: T[], n: number): T[];
  date(options?: FakerDateOptions): Date;
  pastDate(): Date;
  futureDate(): Date;
  hexColor(): string;
  ipv4(): string;
  url(): string;
  phone(): string;
  arrayOf<T>(fn: (index: number) => T, n: number): T[];
}

export declare const faker: Faker;
