export default interface favoriteModel {
    recipeName?: string;
    recipeId?: number;
    userId?: string;
    favoriteId?: number;
    imageUrl?: string;
    description?: string;
    createdAt?: string;
    isFavorited?: boolean | number;
}