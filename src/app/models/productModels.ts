import { Category } from "../category/category";

// src/app/models/product.interface.ts

export interface ProductInterface {
    // 💡 Added: Mongoose automatically adds a unique ID. 
    // This is required when reading data back from the API.
    _id: string; 
    
    productName: string;
    
    // Mongoose generates this automatically on creation, but it is returned on reads.
    barcode: string; 
    
    // 💡 Correction: Mongoose ObjectId is returned as a string.
    categoryId: string; 
    // Optional, useful for display purposes.
    cost: number;
    price: number;
    stockQuantity: number;
    
    // Optional fields (use a standard name like imageUrl)
    img?: string; 
    
    // 💡 Correction/Note: Keep the typo 'descrition' if your Mongoose model has it, 
    // otherwise, use 'description'.
    descrition?: string; 
}