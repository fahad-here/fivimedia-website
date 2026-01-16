import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AddOn {
  slug: string;
  name: string;
  price: number;
}

interface WizardState {
  entityType: string;
  stateCode: string;
  stateName: string;
  basePrice: number;
  selectedAddOns: AddOn[];
  customerInfo: {
    fullName: string;
    email: string;
    phoneCode: string;
    phone: string;
    country: string;
    businessName: string;
    notes: string;
  };
}

interface WizardContextType {
  state: WizardState;
  setEntityType: (entity: string) => void;
  setState: (code: string, name: string) => void;
  setBasePrice: (price: number) => void;
  toggleAddOn: (addOn: AddOn) => void;
  setCustomerInfo: (info: Partial<WizardState["customerInfo"]>) => void;
  getTotal: () => number;
  reset: () => void;
}

const initialState: WizardState = {
  entityType: "LLC",
  stateCode: "",
  stateName: "",
  basePrice: 0,
  selectedAddOns: [],
  customerInfo: {
    fullName: "",
    email: "",
    phoneCode: "+1",
    phone: "",
    country: "",
    businessName: "",
    notes: "",
  },
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setWizardState] = useState<WizardState>(initialState);

  const setEntityType = useCallback((entity: string) => {
    setWizardState((prev) => ({ ...prev, entityType: entity }));
  }, []);

  const setState = useCallback((code: string, name: string) => {
    setWizardState((prev) => ({ ...prev, stateCode: code, stateName: name }));
  }, []);

  const setBasePrice = useCallback((price: number) => {
    setWizardState((prev) => ({ ...prev, basePrice: price }));
  }, []);

  const toggleAddOn = useCallback((addOn: AddOn) => {
    setWizardState((prev) => {
      const exists = prev.selectedAddOns.some((a) => a.slug === addOn.slug);
      if (exists) {
        return {
          ...prev,
          selectedAddOns: prev.selectedAddOns.filter((a) => a.slug !== addOn.slug),
        };
      }
      return {
        ...prev,
        selectedAddOns: [...prev.selectedAddOns, addOn],
      };
    });
  }, []);

  const setCustomerInfo = useCallback(
    (info: Partial<WizardState["customerInfo"]>) => {
      setWizardState((prev) => ({
        ...prev,
        customerInfo: { ...prev.customerInfo, ...info },
      }));
    },
    []
  );

  const getTotal = useCallback(() => {
    const addOnsTotal = state.selectedAddOns.reduce((sum, a) => sum + a.price, 0);
    return state.basePrice + addOnsTotal;
  }, [state.basePrice, state.selectedAddOns]);

  const reset = useCallback(() => {
    setWizardState(initialState);
  }, []);

  return (
    <WizardContext.Provider
      value={{
        state,
        setEntityType,
        setState,
        setBasePrice,
        toggleAddOn,
        setCustomerInfo,
        getTotal,
        reset,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
