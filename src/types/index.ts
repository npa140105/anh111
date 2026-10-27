export type IngredientCategory = 'tea' | 'dairy' | 'sweetener' | 'topping' | 'packaging';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  categoryName: string;
  stock: number;
  unit: string;
  safetyThreshold: number;
  costPerUnit: number; // 採購單價費用 (NTD)
  supplier: string; // 供應商名稱
  supplierPhone: string; // 供應商電話
  leadTimeDays: number;
  lastRestocked: string;
  notes?: string;
}

export type DrinkCategory = 'all' | 'classic_tea' | 'milk_tea' | 'cheese_foam' | 'fruit_tea' | 'specialty';

export interface RecipeRequirement {
  ingredientId: string;
  amountM: number;
  amountL: number;
}

export interface Drink {
  id: string;
  name: string;
  enName: string;
  category: DrinkCategory;
  categoryName: string;
  priceM: number;
  priceL: number;
  description: string;
  tag?: string;
  color: string;
  recipe: RecipeRequirement[];
}

export interface DrinkBOMItem {
  ingredientId: string;
  ingredientName: string;
  categoryName: string;
  unit: string;
  costPerUnit: number;
  stock: number;
  amountM: number;
  amountL: number;
  costM: number;
  costL: number;
}

export interface DrinkBOMAnalysis {
  drink: Drink;
  items: DrinkBOMItem[];
  totalCostM: number;
  totalCostL: number;
  grossMarginM: number;
  grossMarginL: number;
  profitM: number;
  profitL: number;
  maxCupsM: number;
  maxCupsL: number;
  bottleneckM?: { ingredientName: string; maxCups: number; unit: string; currentStock: number };
  bottleneckL?: { ingredientName: string; maxCups: number; unit: string; currentStock: number };
}

export interface Topping {
  id: string;
  name: string;
  price: number;
  ingredientId: string;
  amountPerServing: number;
}

export type CupSize = 'M' | 'L';
export type IceLevel = '正常冰' | '少冰' | '微冰' | '去冰' | '常溫' | '溫熱';
export type SugarLevel = '正常糖(10分)' | '少糖(7分)' | '半糖(5分)' | '微糖(3分)' | '一分糖(1分)' | '無糖(0分)';

export interface CartItem {
  id: string; // unique cart row id
  drinkId: string;
  drinkName: string;
  size: CupSize;
  ice: IceLevel;
  sugar: SugarLevel;
  toppings: Topping[];
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string;
  ecoCup: boolean; // 自備環保杯折5元
}

export type DiningType = 'takeaway' | 'dine_in' | 'delivery';
export type PaymentMethod = 'cash' | 'line_pay' | 'credit_card' | 'apple_pay';

export type MemberVerificationStatus = 'approved' | 'pending_approval' | 'suspended';
export type VerificationMethod = 'email_verified' | 'admin_manual' | 'auto';

export interface Member {
  id: string;
  memberCode: string; // e.g. BF-8801
  name: string;
  phone: string; // Key phone number for POS lookup!
  email: string;
  emailVerified?: boolean; // Completed Firebase Email verification
  authUid?: string; // Firebase Auth user ID
  verificationStatus: MemberVerificationStatus;
  verificationMethod: VerificationMethod;
  approvedAt?: string;
  approvedBy?: string;
  registeredAt: string;
  points: number; // accumulated reward points
  totalSpent: number; // total spending NTD
  orderCount: number;
  birthday?: string;
  preferredSugar?: string;
  preferredIce?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  timestamp: string;
  diningType: DiningType;
  items: CartItem[];
  subtotal: number;
  ecoDiscount: number;
  otherDiscount: number;
  memberDiscount?: number;
  totalAmount: number;
  totalCups: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  status: 'completed' | 'cancelled';
  clerk: string;
  memberId?: string;
  memberName?: string;
  memberPhone?: string;
  pointsEarned?: number;
  pointsUsed?: number;
}

export type StockLogType = 'sale_deduction' | 'restock' | 'adjustment' | 'spoilage';

export interface StockLog {
  id: string;
  timestamp: string;
  ingredientId: string;
  ingredientName: string;
  changeAmount: number; // negative for deduction, positive for restock
  unit: string;
  remainingStock: number;
  type: StockLogType;
  referenceId?: string; // e.g. orderNumber
  note?: string;
}

export interface RestockRecommendation {
  ingredientId: string;
  name: string;
  categoryName: string;
  currentStock: number;
  safetyThreshold: number;
  unit: string;
  suggestedOrderAmount: number;
  estimatedCost: number;
  supplier: string;
  supplierPhone: string;
  leadTimeDays: number;
  daysRemainingEst: number;
  urgency: 'critical' | 'warning' | 'normal';
}

export interface CustomRecipe {
  id: string;
  name: string;
  createdAt: string;
  teaId: string;
  milkId?: string;
  sweetenerId: string;
  sugarLevel: SugarLevel;
  iceLevel: IceLevel;
  size: CupSize;
  toppingIds: string[];
  notes?: string;
  calculatedPrice: number;
}

