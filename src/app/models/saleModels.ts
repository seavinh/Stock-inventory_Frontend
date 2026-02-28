
import { User } from "../user/user";

export interface Sale {
  _id?: string;
  userId: string; // ObjectId as string in Angular
  paymentType: 'cash' | 'qr';
  productID: string;
  salePrice: number;
  remark?: string;
  saleItemId: string[]; // Array of ObjectIds as strings
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Optional: Create a DTO (Data Transfer Object) for creating new sales
export interface CreateSaleDto {
  userId: string;
  paymentType: 'cash' | 'qr';
  salePrice: number;
  remark?: string;
  saleItemId: string[];
}

// Optional: If you need populated references
export interface SalePopulated extends Omit<Sale, 'userId' | 'saleItemId'> {
  userId:User; // Replace with your User interface
}