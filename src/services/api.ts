import { Product, Apartado, StoreConfig } from '../types';
import { initialProducts, initialApartados, initialStoreConfig } from '../data/initialData';
import { supabase, isSupabaseConfigured, STORE_ROW_ID, UPLOADS_BUCKET } from './supabase';

const LOCAL_FAVORITES_KEY = 'senora_cositas_favorites';

// ---------------------------------------------------------------------------
// Todo el catálogo (products / apartados / config) vive en UNA sola fila
// de la tabla `store` en Supabase, en la columna `data` (tipo jsonb).
// Esto guarda en la nube y es visible desde cualquier dispositivo/navegador.
// ---------------------------------------------------------------------------

type StoreData = { products: Product[]; apartados: Apartado[]; config: StoreConfig };

async function fetchStoreRow(): Promise<StoreData> {
  const { data, error } = await supabase
    .from('store')
    .select('data')
    .eq('id', STORE_ROW_ID)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    // Primera vez: no existe la fila todavía, la creamos con los datos iniciales.
    const initial: StoreData = {
      products: initialProducts,
      apartados: initialApartados,
      config: initialStoreConfig,
    };
    const { error: insertError } = await supabase
      .from('store')
      .insert({ id: STORE_ROW_ID, data: initial });
    if (insertError) throw insertError;
    return initial;
  }

  return data.data as StoreData;
}

async function saveStoreRow(data: StoreData): Promise<void> {
  const { error } = await supabase
    .from('store')
    .upsert({ id: STORE_ROW_ID, data, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export const api = {
  // Favorites (esto sí puede quedarse local: es preferencia personal del navegador de cada cliente)
  getFavorites(): string[] {
    try {
      const stored = localStorage.getItem(LOCAL_FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveFavorites(favorites: string[]) {
    try {
      localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Error saving favorites:', e);
    }
  },

  // Image Upload helper: sube la imagen al bucket de Supabase Storage y
  // devuelve una URL pública permanente. Si falla, lanza un error real
  // (antes se guardaba el base64 gigante como si nada, y eso rompía todo).
  async uploadImage(base64Data: string, filename?: string): Promise<string> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase no está configurado: la imagen no se puede guardar de forma permanente.');
    }

    const matches = base64Data.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
    if (!matches) {
      // Ya es una URL normal (por ejemplo una imagen de muestra), no hay nada que subir.
      return base64Data;
    }

    const mimeType = matches[1];
    const raw = atob(matches[2]);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

    let extension = 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
    else if (mimeType.includes('webp')) extension = 'webp';
    else if (mimeType.includes('gif')) extension = 'gif';
    else if (mimeType.includes('svg')) extension = 'svg';

    const safeBaseName = (filename || 'image').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const uniqueFileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeBaseName}.${extension}`;

    const { error } = await supabase.storage
      .from(UPLOADS_BUCKET)
      .upload(uniqueFileName, bytes, { contentType: mimeType, upsert: false });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from(UPLOADS_BUCKET).getPublicUrl(uniqueFileName);
    return publicUrlData.publicUrl;
  },

  // Store data
  async getStoreData(): Promise<StoreData> {
    if (!isSupabaseConfigured) {
      // Sin Supabase configurado no hay dónde guardar en línea; mostramos
      // los datos de ejemplo para que la app no se vea rota, pero nada
      // de lo que se haga aquí se va a guardar.
      return { products: initialProducts, apartados: initialApartados, config: initialStoreConfig };
    }
    return fetchStoreRow();
  },

  // Products CRUD
  async addProduct(product: Partial<Product>): Promise<Product> {
    const store = await fetchStoreRow();
    const newProduct: Product = {
      ...product,
      id: product.id || `prod-${Date.now()}`,
      name: product.name || 'Nuevo Producto',
      description: product.description || '',
      category: product.category || 'General',
      price: product.price || 0,
      comparePrice: product.comparePrice,
      stock: product.stock || 0,
      designs: product.designs || [],
      colors: product.colors || [],
      formats: product.formats || [],
      isNew: product.isNew,
      isFeatured: product.isFeatured,
      tags: product.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Product;

    store.products = [newProduct, ...(store.products || [])];
    await saveStoreRow(store);
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const store = await fetchStoreRow();
    const index = (store.products || []).findIndex(p => p.id === id);
    if (index === -1) throw new Error('Producto no encontrado');

    const updated = { ...store.products[index], ...updates, id, updatedAt: new Date().toISOString() };
    store.products[index] = updated;
    await saveStoreRow(store);
    return updated;
  },

  async updateStock(id: string, delta?: number, exactStock?: number): Promise<{ stock: number }> {
    const store = await fetchStoreRow();
    const index = (store.products || []).findIndex(p => p.id === id);
    if (index === -1) throw new Error('Producto no encontrado');

    let current = store.products[index].stock || 0;
    if (typeof exactStock === 'number') {
      current = Math.max(0, exactStock);
    } else if (typeof delta === 'number') {
      current = Math.max(0, current + delta);
    }
    store.products[index].stock = current;
    store.products[index].updatedAt = new Date().toISOString();
    await saveStoreRow(store);
    return { stock: current };
  },

  async deleteProduct(id: string): Promise<boolean> {
    const store = await fetchStoreRow();
    store.products = (store.products || []).filter(p => p.id !== id);
    await saveStoreRow(store);
    return true;
  },

  // Convierte un apartado (nuevo o viejo) en su lista de productos (items).
  // Si el apartado es de antes de este cambio, arma un item con sus campos antiguos.
  _getApartadoItems(apt: Apartado): import('../types').ApartadoItem[] {
    if (apt.items && apt.items.length > 0) return apt.items;
    return [{
      id: `item-${apt.id}-legacy`,
      productId: apt.productId,
      productName: apt.productName,
      productImage: apt.productImage,
      selectedDesign: apt.selectedDesign,
      selectedColor: apt.selectedColor,
      selectedFormat: apt.selectedFormat,
      quantity: apt.quantity,
      unitPrice: apt.unitPrice,
      subtotal: apt.totalPrice,
    }];
  },

  // Apartados CRUD
  async createApartado(apartadoData: {
    clientName: string;
    clientNote: string;
    clientPhone?: string;
    productId: string;
    productName: string;
    productImage?: string;
    selectedDesign?: string;
    selectedColor?: string;
    selectedFormat?: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
    initialAbono?: number;
    initialAbonoNote?: string;
    decrementStock?: boolean;
  }): Promise<Apartado> {
    const store = await fetchStoreRow();

    const totalPrice = Number(apartadoData.totalPrice) || (Number(apartadoData.unitPrice) * (Number(apartadoData.quantity) || 1));
    const initialAbono = Number(apartadoData.initialAbono) || 0;
    const abonos = [];
    if (initialAbono > 0) {
      abonos.push({
        id: `abn-${Date.now()}`,
        amount: initialAbono,
        date: new Date().toISOString(),
        note: apartadoData.initialAbonoNote || 'Anticipo inicial',
      });
    }
    const totalAbonado = abonos.reduce((acc, curr) => acc + curr.amount, 0);
    const saldoPendiente = Math.max(0, totalPrice - totalAbonado);
    const status = saldoPendiente === 0 ? 'liquidado' : (totalAbonado > 0 ? 'pagado_parcial' : 'apartado');

    const newApartado: Apartado = {
      id: `apt-${Date.now()}`,
      clientName: apartadoData.clientName || 'Cliente',
      clientNote: apartadoData.clientNote || '',
      clientPhone: apartadoData.clientPhone || '',
      items: [{
        id: `item-${Date.now()}`,
        productId: apartadoData.productId,
        productName: apartadoData.productName,
        productImage: apartadoData.productImage,
        selectedDesign: apartadoData.selectedDesign,
        selectedColor: apartadoData.selectedColor,
        selectedFormat: apartadoData.selectedFormat,
        quantity: Number(apartadoData.quantity) || 1,
        unitPrice: Number(apartadoData.unitPrice) || totalPrice,
        subtotal: totalPrice,
      }],
      productId: apartadoData.productId,
      productName: apartadoData.productName,
      productImage: apartadoData.productImage,
      selectedDesign: apartadoData.selectedDesign,
      selectedColor: apartadoData.selectedColor,
      selectedFormat: apartadoData.selectedFormat,
      quantity: Number(apartadoData.quantity) || 1,
      unitPrice: Number(apartadoData.unitPrice) || totalPrice,
      totalPrice,
      abonos,
      totalAbonado,
      saldoPendiente,
      status: status as Apartado['status'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.apartados = [newApartado, ...(store.apartados || [])];

    if (apartadoData.decrementStock && apartadoData.productId) {
      const prodIndex = (store.products || []).findIndex(p => p.id === apartadoData.productId);
      if (prodIndex !== -1) {
        store.products[prodIndex].stock = Math.max(0, (store.products[prodIndex].stock || 0) - (Number(apartadoData.quantity) || 1));
      }
    }

    await saveStoreRow(store);
    return newApartado;
  },

  // Solo la administradora usa esto: agrega otro producto a un apartado (cuenta) que ya existe.
  async addProductToApartado(apartadoId: string, itemData: {
    productId: string;
    productName: string;
    productImage?: string;
    selectedDesign?: string;
    selectedColor?: string;
    selectedFormat?: string;
    quantity: number;
    unitPrice: number;
    decrementStock?: boolean;
  }): Promise<Apartado> {
    const store = await fetchStoreRow();
    const index = (store.apartados || []).findIndex(a => a.id === apartadoId);
    if (index === -1) throw new Error('Apartado no encontrado');

    const current = store.apartados[index];
    const existingItems = this._getApartadoItems(current);
    const quantity = Number(itemData.quantity) || 1;
    const unitPrice = Number(itemData.unitPrice) || 0;
    const newItem = {
      id: `item-${Date.now()}`,
      productId: itemData.productId,
      productName: itemData.productName,
      productImage: itemData.productImage,
      selectedDesign: itemData.selectedDesign,
      selectedColor: itemData.selectedColor,
      selectedFormat: itemData.selectedFormat,
      quantity,
      unitPrice,
      subtotal: unitPrice * quantity,
    };
    const updatedItems = [...existingItems, newItem];
    const totalPrice = updatedItems.reduce((sum, it) => sum + Number(it.subtotal || 0), 0);
    const totalAbonado = (current.abonos || []).reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const saldoPendiente = Math.max(0, totalPrice - totalAbonado);

    let newStatus = current.status;
    if (saldoPendiente === 0 && current.status !== 'entregado') {
      newStatus = 'liquidado';
    } else if (current.status === 'liquidado' && saldoPendiente > 0) {
      newStatus = totalAbonado > 0 ? 'pagado_parcial' : 'apartado';
    }

    const updated: Apartado = {
      ...current,
      items: updatedItems,
      totalPrice,
      saldoPendiente,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    store.apartados[index] = updated;

    if (itemData.decrementStock && itemData.productId) {
      const prodIndex = (store.products || []).findIndex(p => p.id === itemData.productId);
      if (prodIndex !== -1) {
        store.products[prodIndex].stock = Math.max(0, (store.products[prodIndex].stock || 0) - quantity);
      }
    }

    await saveStoreRow(store);
    return updated;
  },

  async addAbono(apartado: Apartado, amount: number, note?: string): Promise<Apartado> {
    const store = await fetchStoreRow();
    const index = (store.apartados || []).findIndex(a => a.id === apartado.id);
    if (index === -1) throw new Error('Apartado no encontrado');

    const nowIso = new Date().toISOString();
    const numericAmount = Math.max(0, Number(amount) || 0);
    const newAbono = { id: `abn-${Date.now()}`, amount: numericAmount, date: nowIso, note: note || 'Abono registrado' };

    const current = store.apartados[index];
    const updatedAbonos = [...(current.abonos || []), newAbono];
    const totalAbonado = updatedAbonos.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const saldoPendiente = Math.max(0, Number(current.totalPrice) - totalAbonado);

    let newStatus = current.status;
    if (saldoPendiente === 0 && current.status !== 'entregado') {
      newStatus = 'liquidado';
    } else if (totalAbonado > 0 && current.status === 'apartado') {
      newStatus = 'pagado_parcial';
    }

    const updated: Apartado = { ...current, abonos: updatedAbonos, totalAbonado, saldoPendiente, status: newStatus, updatedAt: nowIso };
    store.apartados[index] = updated;
    await saveStoreRow(store);
    return updated;
  },

  async updateApartado(id: string, updates: Partial<Apartado>): Promise<Apartado> {
    const store = await fetchStoreRow();
    const index = (store.apartados || []).findIndex(a => a.id === id);
    if (index === -1) throw new Error('Apartado no encontrado');

    const existing = store.apartados[index];
    const updated: Apartado = { ...existing, ...updates, id, updatedAt: new Date().toISOString() } as Apartado;
    const totalAbonado = (updated.abonos || []).reduce((s, a) => s + Number(a.amount || 0), 0);
    updated.totalAbonado = totalAbonado;
    updated.saldoPendiente = Math.max(0, Number(updated.totalPrice) - totalAbonado);

    store.apartados[index] = updated;
    await saveStoreRow(store);
    return updated;
  },

  async deleteApartado(id: string): Promise<boolean> {
    const store = await fetchStoreRow();
    store.apartados = (store.apartados || []).filter(a => a.id !== id);
    await saveStoreRow(store);
    return true;
  },

  // Config
  async updateConfig(config: Partial<StoreConfig>): Promise<StoreConfig> {
    const store = await fetchStoreRow();
    store.config = { ...(store.config || initialStoreConfig), ...config };
    await saveStoreRow(store);
    return store.config;
  },

  async resetData(): Promise<void> {
    const initial: StoreData = { products: initialProducts, apartados: initialApartados, config: initialStoreConfig };
    await saveStoreRow(initial);
    localStorage.removeItem(LOCAL_FAVORITES_KEY);
  },
};
