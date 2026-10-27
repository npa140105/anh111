import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Ingredient,
  Drink,
  Topping,
  Order,
  CartItem,
  StockLog,
  RestockRecommendation,
  PaymentMethod,
  DiningType,
  CustomRecipe,
  DrinkBOMAnalysis,
  DrinkBOMItem,
  RecipeRequirement,
  Member,
  VerificationMethod,
} from '../types';
import {
  INITIAL_INGREDIENTS,
  INITIAL_DRINKS,
  INITIAL_TOPPINGS,
  INITIAL_ORDERS,
  INITIAL_STOCK_LOGS,
  INITIAL_MEMBERS,
} from '../data/initialData';
import { playCashRegisterSound, playAlertChime, playSelectSound } from '../utils/audio';
import { cloudMemberService, cloudOrderService } from '../lib/firebase';

interface ShopContextType {
  // Inventory
  ingredients: Ingredient[];
  drinks: Drink[];
  toppings: Topping[];
  stockLogs: StockLog[];
  orders: Order[];
  
  // Member Management & Cloud Sync
  members: Member[];
  pendingMembersCount: number;
  registerMember: (data: {
    name: string;
    phone: string;
    email: string;
    emailVerified?: boolean;
    authUid?: string;
    birthday?: string;
    preferredSugar?: string;
    preferredIce?: string;
    notes?: string;
    verificationMethod?: VerificationMethod;
  }) => Promise<{ success: boolean; member?: Member; error?: string }>;
  approveMember: (memberId: string, clerkName?: string) => Promise<void>;
  rejectMember: (memberId: string) => Promise<void>;
  deleteMember: (memberId: string) => Promise<void>;
  findMemberByPhone: (phone: string) => Member | null;
  getMemberOrders: (phone: string) => Order[];
  cloudStatus: 'connected' | 'syncing' | 'offline';
  refreshCloudData: () => Promise<void>;

  // Ingredient Management (User creation & config)
  addIngredient: (data: Omit<Ingredient, 'id' | 'lastRestocked'>) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => boolean;
  restockIngredient: (ingredientId: string, amount: number, note?: string) => void;
  adjustStock: (ingredientId: string, newStock: number, reason: string) => void;
  bulkRestockAllAlerts: () => void;
  
  // Drink & BOM Management
  addDrink: (data: Omit<Drink, 'id'>) => void;
  updateDrink: (id: string, updates: Partial<Drink>) => void;
  deleteDrink: (id: string) => boolean;
  updateDrinkBOM: (drinkId: string, recipe: RecipeRequirement[]) => void;
  getDrinkBOMAnalysis: (drink: Drink) => DrinkBOMAnalysis;
  allBOMAnalyses: DrinkBOMAnalysis[];

  // Custom Recipes Builder
  customRecipes: CustomRecipe[];
  saveCustomRecipe: (recipe: Omit<CustomRecipe, 'id' | 'createdAt'>) => CustomRecipe;
  deleteCustomRecipe: (id: string) => void;
  addCustomRecipeToCart: (recipe: CustomRecipe, quantity?: number, ecoCup?: boolean) => void;

  // Cart & POS
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartItemQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  completeCheckout: (params: {
    paymentMethod: PaymentMethod;
    diningType: DiningType;
    amountPaid: number;
    otherDiscount: number;
    clerk?: string;
    member?: Member | null;
  }) => { success: boolean; order?: Order; error?: string };
  cancelOrder: (orderId: string) => boolean;
  
  // Computed & Alerts
  lowStockCount: number;
  criticalStockCount: number;
  lowStockItems: Ingredient[];
  restockRecommendations: RestockRecommendation[];
  
  // Demo Reset & Modals
  resetToDefaultData: () => void;
  activeOrderModal: Order | null;
  setActiveOrderModal: (order: Order | null) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const STORAGE_KEYS = {
  INGREDIENTS: 'bobaflow_ingredients_v2',
  DRINKS: 'bobaflow_drinks_v2',
  TOPPINGS: 'bobaflow_toppings_v2',
  ORDERS: 'bobaflow_orders_v2',
  STOCK_LOGS: 'bobaflow_stock_logs_v2',
  CUSTOM_RECIPES: 'bobaflow_custom_recipes_v2',
  MEMBERS: 'bobaflow_members_v2',
};

const INITIAL_CUSTOM_RECIPES: CustomRecipe[] = [
  {
    id: 'custom_01',
    name: '私房琥珀抹茶雲朵珍珠',
    createdAt: '2026-10-12 10:30',
    teaId: 'ing_tea_matcha',
    milkId: 'ing_milk_fresh',
    sweetenerId: 'ing_sugar_brown',
    sugarLevel: '微糖(3分)',
    iceLevel: '少冰',
    size: 'L',
    toppingIds: ['top_boba', 'top_cheese'],
    notes: '日式抹茶濃刷，底層黑糖珍珠，頂部海鹽芝士蓋，茶韻層次分明',
    calculatedPrice: 95,
  },
  {
    id: 'custom_02',
    name: '夏日三重Q果香四季青',
    createdAt: '2026-10-12 11:15',
    teaId: 'ing_tea_spring',
    sweetenerId: 'ing_passion_juice',
    sugarLevel: '半糖(5分)',
    iceLevel: '微冰',
    size: 'L',
    toppingIds: ['top_boba', 'top_coconut', 'top_jelly'],
    notes: '埔里百香果汁混搭四季春青茶，嚼感三重奏，酸爽滿分',
    calculatedPrice: 85,
  },
];

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
      return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
    } catch {
      return INITIAL_INGREDIENTS;
    }
  });

  const [drinks, setDrinks] = useState<Drink[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRINKS);
      return saved ? JSON.parse(saved) : INITIAL_DRINKS;
    } catch {
      return INITIAL_DRINKS;
    }
  });

  const [toppings] = useState<Topping[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TOPPINGS);
      return saved ? JSON.parse(saved) : INITIAL_TOPPINGS;
    } catch {
      return INITIAL_TOPPINGS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [stockLogs, setStockLogs] = useState<StockLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_STOCK_LOGS;
    } catch {
      return INITIAL_STOCK_LOGS;
    }
  });

  const [customRecipes, setCustomRecipes] = useState<CustomRecipe[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_RECIPES);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOM_RECIPES;
    } catch {
      return INITIAL_CUSTOM_RECIPES;
    }
  });

  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeOrderModal, setActiveOrderModal] = useState<Order | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');

  const refreshCloudData = async () => {
    try {
      setCloudStatus('syncing');
      const [cloudMembers, cloudOrders] = await Promise.all([
        cloudMemberService.getAllMembers(),
        cloudOrderService.getAllOrders(),
      ]);

      if (cloudMembers && cloudMembers.length > 0) {
        setMembers(cloudMembers);
      } else {
        // Seed initial members to cloud database
        for (const m of INITIAL_MEMBERS) {
          await cloudMemberService.saveMember(m);
        }
      }

      if (cloudOrders && cloudOrders.length > 0) {
        setOrders(cloudOrders);
      } else {
        // Seed initial orders to cloud database
        for (const o of INITIAL_ORDERS) {
          await cloudOrderService.saveOrder(o);
        }
      }
      setCloudStatus('connected');
    } catch (err) {
      console.warn('Cloud sync error or offline fallback:', err);
      setCloudStatus('connected');
    }
  };

  useEffect(() => {
    refreshCloudData();
  }, []);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    } catch (e) {
      console.error(e);
    }
  }, [members]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
    } catch (e) {
      console.error(e);
    }
  }, [ingredients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DRINKS, JSON.stringify(drinks));
    } catch (e) {
      console.error(e);
    }
  }, [drinks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify(stockLogs));
    } catch (e) {
      console.error(e);
    }
  }, [stockLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_RECIPES, JSON.stringify(customRecipes));
    } catch (e) {
      console.error(e);
    }
  }, [customRecipes]);

  // Member Management & Manual Verification
  const pendingMembersCount = useMemo(() => {
    return members.filter((m) => m.verificationStatus === 'pending_approval').length;
  }, [members]);

  const findMemberByPhone = (phone: string): Member | null => {
    if (!phone) return null;
    const cleanInput = phone.replace(/[-\s]/g, '').trim();
    if (!cleanInput) return null;
    return (
      members.find((m) => {
        const cleanMemberPhone = m.phone.replace(/[-\s]/g, '').trim();
        return cleanMemberPhone === cleanInput || (cleanInput.length >= 8 && cleanMemberPhone.endsWith(cleanInput));
      }) || null
    );
  };

  const registerMember = async (data: {
    name: string;
    phone: string;
    email: string;
    emailVerified?: boolean;
    authUid?: string;
    birthday?: string;
    preferredSugar?: string;
    preferredIce?: string;
    notes?: string;
    verificationMethod?: VerificationMethod;
  }): Promise<{ success: boolean; member?: Member; error?: string }> => {
    const cleanPhone = data.phone.replace(/[-\s]/g, '').trim();
    if (!data.name.trim()) {
      return { success: false, error: '請輸入會員姓名' };
    }
    if (!cleanPhone || cleanPhone.length < 8) {
      return { success: false, error: '請輸入有效的手機號碼 (至少8碼)' };
    }

    // Check duplicate phone
    const existing = findMemberByPhone(cleanPhone);
    if (existing) {
      return { success: false, error: `該手機號碼已註冊過會員 (會員代碼: ${existing.memberCode})` };
    }

    const now = new Date();
    const registeredAt =
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0') +
      ' ' +
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0') +
      ':' +
      String(now.getSeconds()).padStart(2, '0');

    const nextCodeNum = 8800 + members.length + 1;
    const memberCode = `BF-${nextCodeNum}`;
    const isVerified = data.emailVerified === true;

    const newMember: Member = {
      id: `mem_${Date.now()}`,
      memberCode,
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      emailVerified: isVerified,
      authUid: data.authUid,
      verificationStatus: isVerified ? 'approved' : 'pending_approval',
      verificationMethod: data.verificationMethod || (isVerified ? 'email_verified' : 'admin_manual'),
      approvedAt: isVerified ? registeredAt : undefined,
      approvedBy: isVerified ? 'Firebase 信箱驗證' : undefined,
      registeredAt,
      points: isVerified ? 20 : 0,
      totalSpent: 0,
      orderCount: 0,
      birthday: data.birthday,
      preferredSugar: data.preferredSugar,
      preferredIce: data.preferredIce,
      notes: data.notes || (isVerified ? 'Firebase 信箱驗證通過，自動開通迎賓禮' : '透過會員申請網頁送出，待信箱驗證或管理者審核'),
    };

    setMembers((prev) => [newMember, ...prev]);

    // Save to Google Cloud Firestore database
    try {
      await cloudMemberService.saveMember(newMember);
    } catch (err) {
      console.warn('Firestore member save note:', err);
    }

    return { success: true, member: newMember };
  };

  const approveMember = async (memberId: string, clerkName = '門市店長') => {
    const now = new Date();
    const approvedAt =
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0') +
      ' ' +
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0') +
      ':' +
      String(now.getSeconds()).padStart(2, '0');

    let updatedTarget: Member | undefined;

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          // Welcome bonus points (+20) if new member has 0 points
          const welcomeBonus = m.points === 0 ? 20 : m.points;
          updatedTarget = {
            ...m,
            verificationStatus: 'approved',
            emailVerified: true,
            approvedAt,
            approvedBy: clerkName,
            points: welcomeBonus,
          };
          return updatedTarget;
        }
        return m;
      })
    );
    playCashRegisterSound();

    if (updatedTarget) {
      try {
        await cloudMemberService.updateMember(memberId, {
          verificationStatus: 'approved',
          emailVerified: true,
          approvedAt,
          approvedBy: clerkName,
          points: updatedTarget.points,
        });
      } catch (err) {
        console.warn('Firestore updateMember note:', err);
      }
    }
  };

  const rejectMember = async (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, verificationStatus: 'suspended' } : m))
    );
    try {
      await cloudMemberService.updateMember(memberId, { verificationStatus: 'suspended' });
    } catch (err) {
      console.warn('Firestore rejectMember note:', err);
    }
  };

  const deleteMember = async (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const getMemberOrders = (phone: string): Order[] => {
    const cleanInput = phone.replace(/[-\s]/g, '').trim();
    if (!cleanInput) return [];
    return orders.filter((o) => {
      if (!o.memberPhone) return false;
      const cleanOrderPhone = o.memberPhone.replace(/[-\s]/g, '').trim();
      return cleanOrderPhone === cleanInput || cleanOrderPhone.endsWith(cleanInput);
    });
  };

  // Ingredient Management
  const addIngredient = (data: Omit<Ingredient, 'id' | 'lastRestocked'>) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const newId = `ing_custom_${Date.now()}`;
    const newIngredient: Ingredient = {
      ...data,
      id: newId,
      lastRestocked: dateStr,
    };

    const newLog: StockLog = {
      id: `log_${Date.now()}_init`,
      timestamp: now.toLocaleDateString('zh-TW') + ' ' + now.toLocaleTimeString('zh-TW'),
      ingredientId: newId,
      ingredientName: data.name,
      changeAmount: data.stock,
      unit: data.unit,
      remainingStock: data.stock,
      type: 'restock',
      note: `新建立原物料品項建檔：初始庫存 ${data.stock}${data.unit} (供應商: ${data.supplier}, 電話: ${data.supplierPhone})`,
    };

    setIngredients((prev) => [newIngredient, ...prev]);
    setStockLogs((prev) => [newLog, ...prev]);
  };

  const updateIngredient = (id: string, updates: Partial<Ingredient>) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, ...updates } : ing))
    );
  };

  const deleteIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
    return true;
  };

  // Drink & BOM Management
  const addDrink = (data: Omit<Drink, 'id'>) => {
    const newDrink: Drink = {
      ...data,
      id: `drk_${Date.now()}`,
    };
    setDrinks((prev) => [...prev, newDrink]);
    playSelectSound();
  };

  const updateDrink = (id: string, updates: Partial<Drink>) => {
    setDrinks((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    playSelectSound();
  };

  const deleteDrink = (id: string) => {
    setDrinks((prev) => prev.filter((d) => d.id !== id));
    return true;
  };

  const updateDrinkBOM = (drinkId: string, recipe: RecipeRequirement[]) => {
    setDrinks((prev) => prev.map((d) => (d.id === drinkId ? { ...d, recipe } : d)));
    playSelectSound();
  };

  const getDrinkBOMAnalysis = (drink: Drink): DrinkBOMAnalysis => {
    const items: DrinkBOMItem[] = drink.recipe.map((req) => {
      const ing = ingredients.find((i) => i.id === req.ingredientId);
      const costPerUnit = ing?.costPerUnit || 0;
      const costM = Number(((req.amountM || 0) * costPerUnit).toFixed(2));
      const costL = Number(((req.amountL || 0) * costPerUnit).toFixed(2));
      return {
        ingredientId: req.ingredientId,
        ingredientName: ing?.name || '未知原料',
        categoryName: ing?.categoryName || '一般原料',
        unit: ing?.unit || 'g',
        costPerUnit,
        stock: ing?.stock || 0,
        amountM: req.amountM || 0,
        amountL: req.amountL || 0,
        costM,
        costL,
      };
    });

    const cupMed = ingredients.find((i) => i.id === 'ing_cup_med');
    const cupLarge = ingredients.find((i) => i.id === 'ing_cup_large');
    const strawThin = ingredients.find((i) => i.id === 'ing_straw_thin');
    const sealingFilm = ingredients.find((i) => i.id === 'ing_sealing_film');

    const packagingCostM =
      (cupMed?.costPerUnit || 1.5) + (strawThin?.costPerUnit || 0.35) + (sealingFilm?.costPerUnit || 0.25);
    const packagingCostL =
      (cupLarge?.costPerUnit || 1.8) + (strawThin?.costPerUnit || 0.35) + (sealingFilm?.costPerUnit || 0.25);

    const recipeCostM = items.reduce((sum, item) => sum + item.costM, 0);
    const recipeCostL = items.reduce((sum, item) => sum + item.costL, 0);

    const totalCostM = Number((recipeCostM + packagingCostM).toFixed(1));
    const totalCostL = Number((recipeCostL + packagingCostL).toFixed(1));

    const profitM = Number((drink.priceM - totalCostM).toFixed(1));
    const profitL = Number((drink.priceL - totalCostL).toFixed(1));

    const grossMarginM = drink.priceM > 0 ? Number(((profitM / drink.priceM) * 100).toFixed(1)) : 0;
    const grossMarginL = drink.priceL > 0 ? Number(((profitL / drink.priceL) * 100).toFixed(1)) : 0;

    let maxCupsM = 99999;
    let bottleneckM: { ingredientName: string; maxCups: number; unit: string; currentStock: number } | undefined;

    let maxCupsL = 99999;
    let bottleneckL: { ingredientName: string; maxCups: number; unit: string; currentStock: number } | undefined;

    drink.recipe.forEach((req) => {
      const ing = ingredients.find((i) => i.id === req.ingredientId);
      if (ing) {
        if (req.amountM > 0) {
          const possibleM = Math.floor(ing.stock / req.amountM);
          if (possibleM < maxCupsM) {
            maxCupsM = possibleM;
            bottleneckM = {
              ingredientName: ing.name,
              maxCups: possibleM,
              unit: ing.unit,
              currentStock: ing.stock,
            };
          }
        }
        if (req.amountL > 0) {
          const possibleL = Math.floor(ing.stock / req.amountL);
          if (possibleL < maxCupsL) {
            maxCupsL = possibleL;
            bottleneckL = {
              ingredientName: ing.name,
              maxCups: possibleL,
              unit: ing.unit,
              currentStock: ing.stock,
            };
          }
        }
      }
    });

    if (cupMed && cupMed.stock < maxCupsM) {
      maxCupsM = cupMed.stock;
      bottleneckM = {
        ingredientName: cupMed.name,
        maxCups: cupMed.stock,
        unit: cupMed.unit,
        currentStock: cupMed.stock,
      };
    }
    if (cupLarge && cupLarge.stock < maxCupsL) {
      maxCupsL = cupLarge.stock;
      bottleneckL = {
        ingredientName: cupLarge.name,
        maxCups: cupLarge.stock,
        unit: cupLarge.unit,
        currentStock: cupLarge.stock,
      };
    }

    if (maxCupsM === 99999) maxCupsM = 0;
    if (maxCupsL === 99999) maxCupsL = 0;

    return {
      drink,
      items,
      totalCostM,
      totalCostL,
      grossMarginM,
      grossMarginL,
      profitM,
      profitL,
      maxCupsM,
      maxCupsL,
      bottleneckM,
      bottleneckL,
    };
  };

  const allBOMAnalyses = useMemo(() => {
    return drinks.map((d) => getDrinkBOMAnalysis(d));
  }, [drinks, ingredients]);

  // Custom Recipe Management
  const saveCustomRecipe = (recipeData: Omit<CustomRecipe, 'id' | 'createdAt'>) => {
    const now = new Date();
    const createdAt = now.toLocaleDateString('zh-TW') + ' ' + now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    const newRecipe: CustomRecipe = {
      ...recipeData,
      id: `custom_${Date.now()}`,
      createdAt,
    };
    setCustomRecipes((prev) => [newRecipe, ...prev]);
    playSelectSound();
    return newRecipe;
  };

  const deleteCustomRecipe = (id: string) => {
    setCustomRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  const addCustomRecipeToCart = (recipe: CustomRecipe, quantity: number = 1, ecoCup: boolean = false) => {
    const selectedToppings = recipe.toppingIds
      .map((tid) => toppings.find((t) => t.id === tid))
      .filter((t): t is Topping => !!t);

    const cartItem: CartItem = {
      id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      drinkId: 'custom_specialty',
      drinkName: `✨ ${recipe.name}`,
      size: recipe.size,
      ice: recipe.iceLevel,
      sugar: recipe.sugarLevel,
      toppings: selectedToppings,
      unitPrice: recipe.calculatedPrice,
      quantity,
      subtotal: recipe.calculatedPrice * quantity,
      notes: recipe.notes || '自訂特調配方',
      ecoCup,
    };

    addToCart(cartItem);
    playSelectSound();
  };

  // Cart Operations
  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
          i.drinkId === item.drinkId &&
          i.drinkName === item.drinkName &&
          i.size === item.size &&
          i.ice === item.ice &&
          i.sugar === item.sugar &&
          i.ecoCup === item.ecoCup &&
          i.toppings.map((t) => t.id).sort().join(',') ===
            item.toppings.map((t) => t.id).sort().join(',')
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const newQty = existing.quantity + item.quantity;
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          subtotal: existing.unitPrice * newQty,
        };
        return updated;
      }
      return [...prev, item];
    });
  };

  const updateCartItemQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              subtotal: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Checkout Execution with real-time stock deductions
  const completeCheckout = ({
    paymentMethod,
    diningType,
    amountPaid,
    otherDiscount,
    clerk = '收銀員 01',
    member = null,
  }: {
    paymentMethod: PaymentMethod;
    diningType: DiningType;
    amountPaid: number;
    otherDiscount: number;
    clerk?: string;
    member?: Member | null;
  }) => {
    if (cart.length === 0) {
      return { success: false, error: '購物車內尚無品項' };
    }

    const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    const ecoDiscount = cart.reduce((acc, item) => (item.ecoCup ? acc + 5 * item.quantity : acc), 0);
    const totalAmount = Math.max(0, subtotal - ecoDiscount - otherDiscount);
    const totalCups = cart.reduce((acc, item) => acc + item.quantity, 0);
    const change = Math.max(0, amountPaid - totalAmount);

    const now = new Date();
    const timestamp =
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0') +
      ' ' +
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0') +
      ':' +
      String(now.getSeconds()).padStart(2, '0');

    const orderNumber = `#B${100 + orders.length + 1}`;
    const deductions: Record<string, number> = {};

    cart.forEach((item) => {
      // If it's a standard drink
      const drink = drinks.find((d) => d.id === item.drinkId);
      if (drink) {
        drink.recipe.forEach((req) => {
          const amount = (item.size === 'L' ? req.amountL : req.amountM) * item.quantity;
          deductions[req.ingredientId] = (deductions[req.ingredientId] || 0) + amount;
        });

        if (!item.ecoCup) {
          const cupIngredientId = item.size === 'L' ? 'ing_cup_large' : 'ing_cup_med';
          deductions[cupIngredientId] = (deductions[cupIngredientId] || 0) + item.quantity;
        }
      } else {
        // Custom recipe drink
        // Standard cup deduction
        if (!item.ecoCup) {
          const cupIngredientId = item.size === 'L' ? 'ing_cup_large' : 'ing_cup_med';
          deductions[cupIngredientId] = (deductions[cupIngredientId] || 0) + item.quantity;
        }
        // Deduct sealing film & straw
        deductions['ing_sealing_film'] = (deductions['ing_sealing_film'] || 0) + item.quantity;
        const hasThickTopping = item.toppings.some((t) => t.id === 'top_boba' || t.id === 'top_coconut' || t.id === 'top_taro');
        const strawId = hasThickTopping ? 'ing_straw_thick' : 'ing_straw_thin';
        deductions[strawId] = (deductions[strawId] || 0) + item.quantity;
      }

      // Topping deductions for both standard & custom
      item.toppings.forEach((top) => {
        const topDef = toppings.find((t) => t.id === top.id);
        if (topDef) {
          const topAmount = topDef.amountPerServing * item.quantity;
          deductions[topDef.ingredientId] = (deductions[topDef.ingredientId] || 0) + topAmount;
        }
      });
    });

    const newStockLogs: StockLog[] = [];
    const updatedIngredients = ingredients.map((ing) => {
      const deductionAmount = deductions[ing.id];
      if (deductionAmount) {
        const newStock = Math.max(0, ing.stock - deductionAmount);
        newStockLogs.push({
          id: `log_${Date.now()}_${ing.id}`,
          timestamp,
          ingredientId: ing.id,
          ingredientName: ing.name,
          changeAmount: -deductionAmount,
          unit: ing.unit,
          remainingStock: newStock,
          type: 'sale_deduction',
          referenceId: orderNumber,
          note: `銷售核銷：訂單 ${orderNumber} (${totalCups}杯飲品)`,
        });
        return {
          ...ing,
          stock: newStock,
        };
      }
      return ing;
    });

    // Reward points: 1 point for every NT$10
    const pointsEarned = member && member.verificationStatus === 'approved' ? Math.floor(totalAmount / 10) : 0;

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      timestamp,
      diningType,
      items: [...cart],
      subtotal,
      ecoDiscount,
      otherDiscount,
      totalAmount,
      totalCups,
      paymentMethod,
      amountPaid,
      change,
      status: 'completed',
      clerk,
      memberId: member?.id,
      memberName: member?.name,
      memberPhone: member?.phone,
      pointsEarned,
    };

    // Save order to Google Cloud Firestore database
    try {
      cloudOrderService.saveOrder(newOrder);
    } catch (err) {
      console.warn('Firestore saveOrder note:', err);
    }

    if (member) {
      const updatedPoints = member.points + pointsEarned;
      const updatedSpent = member.totalSpent + totalAmount;
      const updatedCount = member.orderCount + 1;

      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id
            ? {
                ...m,
                points: updatedPoints,
                totalSpent: updatedSpent,
                orderCount: updatedCount,
              }
            : m
        )
      );

      // Update points and total spending in Google Cloud Firestore database
      try {
        cloudMemberService.updateMember(member.id, {
          points: updatedPoints,
          totalSpent: updatedSpent,
          orderCount: updatedCount,
        });
      } catch (err) {
        console.warn('Firestore updateMember points note:', err);
      }
    }

    setIngredients(updatedIngredients);
    setStockLogs((prev) => [...newStockLogs, ...prev]);
    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setActiveOrderModal(newOrder);

    playCashRegisterSound();

    const hasTriggeredWarning = updatedIngredients.some(
      (ing) => deductions[ing.id] && ing.stock <= ing.safetyThreshold
    );
    if (hasTriggeredWarning) {
      setTimeout(() => {
        playAlertChime();
      }, 600);
    }

    return { success: true, order: newOrder };
  };

  const cancelOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status === 'cancelled') return false;

    const additions: Record<string, number> = {};
    targetOrder.items.forEach((item) => {
      const drink = drinks.find((d) => d.id === item.drinkId);
      if (drink) {
        drink.recipe.forEach((req) => {
          const amount = (item.size === 'L' ? req.amountL : req.amountM) * item.quantity;
          additions[req.ingredientId] = (additions[req.ingredientId] || 0) + amount;
        });
        if (!item.ecoCup) {
          const cupIngredientId = item.size === 'L' ? 'ing_cup_large' : 'ing_cup_med';
          additions[cupIngredientId] = (additions[cupIngredientId] || 0) + item.quantity;
        }
      }
      item.toppings.forEach((top) => {
        const topDef = toppings.find((t) => t.id === top.id);
        if (topDef) {
          additions[topDef.ingredientId] =
            (additions[topDef.ingredientId] || 0) + topDef.amountPerServing * item.quantity;
        }
      });
    });

    const now = new Date();
    const timestamp = now.toLocaleDateString('zh-TW') + ' ' + now.toLocaleTimeString('zh-TW');

    const restoreLogs: StockLog[] = [];
    const restoredIngredients = ingredients.map((ing) => {
      const addAmount = additions[ing.id];
      if (addAmount) {
        const newStock = ing.stock + addAmount;
        restoreLogs.push({
          id: `log_${Date.now()}_${ing.id}_cancel`,
          timestamp,
          ingredientId: ing.id,
          ingredientName: ing.name,
          changeAmount: addAmount,
          unit: ing.unit,
          remainingStock: newStock,
          type: 'adjustment',
          referenceId: targetOrder.orderNumber,
          note: `訂單作廢退款：還原庫存 (${targetOrder.orderNumber})`,
        });
        return { ...ing, stock: newStock };
      }
      return ing;
    });

    setIngredients(restoredIngredients);
    setStockLogs((prev) => [...restoreLogs, ...prev]);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
    );
    return true;
  };

  const restockIngredient = (ingredientId: string, amount: number, note?: string) => {
    if (amount <= 0) return;
    const now = new Date();
    const timestamp = now.toLocaleDateString('zh-TW') + ' ' + now.toLocaleTimeString('zh-TW');

    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id === ingredientId) {
          const newStock = ing.stock + amount;
          const newLog: StockLog = {
            id: `log_${Date.now()}_${ing.id}`,
            timestamp,
            ingredientId: ing.id,
            ingredientName: ing.name,
            changeAmount: amount,
            unit: ing.unit,
            remainingStock: newStock,
            type: 'restock',
            note: note || `進貨入庫 (+${amount}${ing.unit}) - 供應商: ${ing.supplier}`,
          };
          setStockLogs((l) => [newLog, ...l]);
          return {
            ...ing,
            stock: newStock,
            lastRestocked: now.toISOString().split('T')[0],
          };
        }
        return ing;
      })
    );
  };

  const adjustStock = (ingredientId: string, newStock: number, reason: string) => {
    const ing = ingredients.find((i) => i.id === ingredientId);
    if (!ing) return;
    const diff = newStock - ing.stock;
    const now = new Date();
    const timestamp = now.toLocaleDateString('zh-TW') + ' ' + now.toLocaleTimeString('zh-TW');

    const log: StockLog = {
      id: `log_${Date.now()}_${ing.id}`,
      timestamp,
      ingredientId: ing.id,
      ingredientName: ing.name,
      changeAmount: diff,
      unit: ing.unit,
      remainingStock: newStock,
      type: diff < 0 ? 'spoilage' : 'adjustment',
      note: reason || `盤點校正：由 ${ing.stock} 調整為 ${newStock}`,
    };

    setIngredients((prev) =>
      prev.map((i) => (i.id === ingredientId ? { ...i, stock: newStock } : i))
    );
    setStockLogs((prev) => [log, ...prev]);
  };

  const lowStockItems = useMemo(() => {
    return ingredients.filter((ing) => ing.stock <= ing.safetyThreshold);
  }, [ingredients]);

  const criticalStockCount = useMemo(() => {
    return ingredients.filter((ing) => ing.stock <= ing.safetyThreshold * 0.5).length;
  }, [ingredients]);

  const lowStockCount = lowStockItems.length;

  const restockRecommendations: RestockRecommendation[] = useMemo(() => {
    return lowStockItems.map((ing) => {
      const targetStock = ing.safetyThreshold * 2.5;
      const suggestedAmount = Math.max(0, Math.ceil(targetStock - ing.stock));
      const estimatedCost = Math.round(suggestedAmount * ing.costPerUnit);
      const isCritical = ing.stock <= ing.safetyThreshold * 0.5;
      const ratio = ing.stock / (ing.safetyThreshold || 1);
      const daysRemainingEst = Math.max(0.5, Number((ratio * 1.5).toFixed(1)));

      return {
        ingredientId: ing.id,
        name: ing.name,
        categoryName: ing.categoryName,
        currentStock: ing.stock,
        safetyThreshold: ing.safetyThreshold,
        unit: ing.unit,
        suggestedOrderAmount: suggestedAmount,
        estimatedCost,
        supplier: ing.supplier,
        supplierPhone: ing.supplierPhone,
        leadTimeDays: ing.leadTimeDays,
        daysRemainingEst,
        urgency: isCritical ? 'critical' : 'warning',
      };
    });
  }, [lowStockItems]);

  const bulkRestockAllAlerts = () => {
    if (restockRecommendations.length === 0) return;
    const now = new Date();
    const timestamp = now.toLocaleDateString('zh-TW') + ' ' + now.toLocaleTimeString('zh-TW');

    const logsToAdd: StockLog[] = [];
    const updated = ingredients.map((ing) => {
      const rec = restockRecommendations.find((r) => r.ingredientId === ing.id);
      if (rec && rec.suggestedOrderAmount > 0) {
        const newStock = ing.stock + rec.suggestedOrderAmount;
        logsToAdd.push({
          id: `log_${Date.now()}_${ing.id}_bulk`,
          timestamp,
          ingredientId: ing.id,
          ingredientName: ing.name,
          changeAmount: rec.suggestedOrderAmount,
          unit: ing.unit,
          remainingStock: newStock,
          type: 'restock',
          note: `一鍵採購補貨單入庫 (+${rec.suggestedOrderAmount}${ing.unit}) [供應商: ${ing.supplier}, 電話: ${ing.supplierPhone}]`,
        });
        return {
          ...ing,
          stock: newStock,
          lastRestocked: now.toISOString().split('T')[0],
        };
      }
      return ing;
    });

    setIngredients(updated);
    setStockLogs((prev) => [...logsToAdd, ...prev]);
    playCashRegisterSound();
  };

  const resetToDefaultData = () => {
    setIngredients(INITIAL_INGREDIENTS);
    setDrinks(INITIAL_DRINKS);
    setOrders(INITIAL_ORDERS);
    setStockLogs(INITIAL_STOCK_LOGS);
    setCustomRecipes(INITIAL_CUSTOM_RECIPES);
    setMembers(INITIAL_MEMBERS);
    setCart([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.INGREDIENTS);
      localStorage.removeItem(STORAGE_KEYS.DRINKS);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.STOCK_LOGS);
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_RECIPES);
      localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    } catch {
      // Ignore
    }
  };

  return (
    <ShopContext.Provider
      value={{
        ingredients,
        drinks,
        toppings,
        stockLogs,
        orders,
        members,
        pendingMembersCount,
        registerMember,
        approveMember,
        rejectMember,
        deleteMember,
        findMemberByPhone,
        getMemberOrders,
        cloudStatus,
        refreshCloudData,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        restockIngredient,
        adjustStock,
        bulkRestockAllAlerts,
        addDrink,
        updateDrink,
        deleteDrink,
        updateDrinkBOM,
        getDrinkBOMAnalysis,
        allBOMAnalyses,
        customRecipes,
        saveCustomRecipe,
        deleteCustomRecipe,
        addCustomRecipeToCart,
        cart,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        completeCheckout,
        cancelOrder,
        lowStockCount,
        criticalStockCount,
        lowStockItems,
        restockRecommendations,
        resetToDefaultData,
        activeOrderModal,
        setActiveOrderModal,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
