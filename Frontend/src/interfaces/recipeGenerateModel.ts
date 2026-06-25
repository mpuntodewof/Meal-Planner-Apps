    export default interface Root {
        $id: string
        id: number
        name: string
        description: string
        cookingTime: string
        serviceSize: string
        imageUrl: string
        videoUrl: string
        userId: string
        categoriesId: number
        createdAt: string
        updatedAt: string
        categories: any
        appUser: any
        ingredients: Ingredients
        instructions: Instructions
    }
  
    interface Ingredients {
        $id: string
        $values: Value[]
    }
  
    interface Value {
        $id: string
        id: number
        name: string
        description: string
        unit: any
        createdAt: string
        updatedAt: string
        recipeId: number
        recipe: Recipe
    }
  
    interface Recipe {
        $ref: string
    }
    
    interface Instructions {
        $id: string
        $values: Value2[]
    }
    
    interface Value2 {
        $id: string
        id: number
        stepNumber: number
        description: string
        recipeId: number
        recipe: Recipe2
    }
    
    interface Recipe2 {
        $ref: string
    }
  

// export default recipeGenerateModel;