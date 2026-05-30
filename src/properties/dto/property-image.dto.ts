import { ArrayMinSize, ArrayUnique, IsArray, IsString, IsUUID } from 'class-validator';

/**
 * Reorder all images of a property by providing the desired sequence of image IDs.
 * Each ID's index in the array becomes its new `order` value.
 */
export class ReorderImagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  imageIds: string[];
}

/**
 * Public-facing shape returned by the API.
 */
export interface PropertyImageResponse {
  id: string;
  propertyId: string;
  url: string;
  thumbnailUrl: string;
  mediumUrl: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  order: number;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}
