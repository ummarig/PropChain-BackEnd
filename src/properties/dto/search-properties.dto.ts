import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PROPERTY_STATUS_ENUM } from './property.dto';

export const PROPERTY_SORT_FIELDS = [
  'price',
  'createdAt',
  'updatedAt',
  'bedrooms',
  'bathrooms',
  'squareFeet',
  'yearBuilt',
] as const;

export type PropertySortField = (typeof PROPERTY_SORT_FIELDS)[number];

/**
 * Query DTO for advanced property search.
 *
 * Supports:
 *  - Price range (minPrice / maxPrice)
 *  - Location (city / state / zipCode / country, or free-text `location`)
 *  - Property type (propertyType)
 *  - Bedrooms (exact `bedrooms`, or range minBedrooms / maxBedrooms)
 *  - Bathrooms (exact `bathrooms`, or range minBathrooms / maxBathrooms)
 *  - Optional status filter, pagination and sorting
 */
export class SearchPropertiesDto {
  // ----- Price range -----
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  // ----- Location -----
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  /** Free-text search across address, city, state and zipCode (case-insensitive). */
  @IsOptional()
  @IsString()
  location?: string;

  // ----- Property type -----
  @IsOptional()
  @IsString()
  propertyType?: string;

  // ----- Bedrooms -----
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minBedrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxBedrooms?: number;

  // ----- Bathrooms (Decimal in DB, supports half-baths) -----
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBathrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxBathrooms?: number;

  // ----- Status -----
  @IsOptional()
  @IsIn(PROPERTY_STATUS_ENUM)
  status?: (typeof PROPERTY_STATUS_ENUM)[number];

  // ----- Pagination -----
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // ----- Sort -----
  @IsOptional()
  @IsIn(PROPERTY_SORT_FIELDS as unknown as string[])
  sortBy?: PropertySortField = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
