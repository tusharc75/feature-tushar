import useScheduar from 'src/pages/ScheduleAndDispatch/Scheduler/useScheduar';

export type SchedularState = {
  selectedAssets: SelectedAsset[];
  selectedServices: SelectedService[];
  selectedTechnicians: SelectedTechnician[];
  selectedWarehouse: string;
  productOptions: ProductOption[];
  warehouseOptions: WarehouseOption[];
  selectedProduct: string | null;
  loading: boolean;
  activeTab: Tab | null;
  tabs: Tab[];
};
export type UseScheduarActions =
  | { type: 'setSelectedAssets'; payload: SelectedAsset[] }
  | { type: 'setSelectedServices'; payload: SelectedService[] }
  | { type: 'setSelectedTechnicians'; payload: SelectedTechnician[] }
  | { type: 'setSelectedWarehouse'; payload: string }
  | { type: 'setProductOptions'; payload: ProductOption[] }
  | { type: 'setLoading'; payload: boolean }
  | { type: 'setWarehouseOptions'; payload: WarehouseOption[] }
  | { type: 'setSelectedProduct'; payload: string }
  | { type: 'setActiveTab'; payload: Tab }
  | { type: 'setTabs'; payload: Tab[] };

export type UseScheduar = ReturnType<typeof useScheduar>;
export type SchedularComponentProps = {
  schedularState: UseScheduar;
};
export type TabKey = 'assets' | 'services' | 'technicians' | 'customerDetail';
export type Tab = {
  key: TabKey;
  label: string;
};

export type SelectedAsset = {
  _id: string;
  assetNumber: string;
  assetNumberType: string;
  status: string;
  currentOwnerType: string;
  ownerType: string;
  wellNumber: string;
  id: string;
  reserved: boolean;
  product: string;
  productId: string;
  productCategory: string;
  productCategoryId: string;
  warehouse: string;
  warehouseId: string;
  currentOwner: string;
  currentOwnerId: string;
  currentLocation: string;
  currentLocationId: string;
  owner: string;
  ownerId: string;
  productDescription: string;
  productDescriptionId: string;
  createdBy: string;
  createdByDate: Date;
  createdById: string;
  isChecked: boolean;
};
export type SelectedService = {
  _id: string;
  serviceName: string;
  serviceType: string;
  serviceDescription: string;
  serviceImage: string;
  unit: string;
  pricingMethod: string;
  preWork: boolean;
  competencies: string;
  competenciesId: string;
  restcompetencies: any[];
  competencyType: string;
  competencyTypeId: string;
  createdBy: string;
  createdByDate: Date;
  createdById: string;
  id: string;
};
export type SelectedTechnician = {
  _id: string;
  photo: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  description: string;
  createDate: Date;
  competencies: string;
  competenciesId: string;
  restcompetencies: Restcompetency[];
  brand: string;
  concatedName: string;
  competencyType: string;
  competencyTypeId: string;
  warehouse: string;
  warehouseId: string;
  createdBy: string;
  createdByDate: Date;
  createdById: string;
  id: string;
  isChecked: boolean;
  address?: string;
  addressId?: string;
};

export type Restcompetency = {
  optionValue: string;
  optionLabel: string;
};

export type ProductOption = {
  optionValue: string;
  optionLabel: string;
  serializedProduct?: boolean;
  productCategory?: string;
  order: number;
  default: boolean;
};
export type WarehouseOption = {
  optionValue: string;
  optionLabel: string;
  address: string;
  entity: string[];
  manager?: string[];
  order: number;
  default: boolean;
  materialHandlers?: string[];
};
