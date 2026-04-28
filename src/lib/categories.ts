export const CATEGORIES = ["drink", "food", "snacks"] as const;
export type Category = typeof CATEGORIES[number];

export const SUBCATEGORIES: Record<Category, string[]> = {
  drink: ["Iced Coffee", "Frappe", "Mojito"],
  food: ["Wrap", "Sandwich"],
  snacks: ["Cake", "Donut", "French Fries"],
};
