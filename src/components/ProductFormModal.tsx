import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Layers, 
  Palette, 
  Sparkles, 
  Check, 
  DollarSign, 
  Package,
  FileText,
  Tag,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ExternalLink
} from 'lucide-react';
import { Product, ProductDesign, ProductColor } from '../types';
import { api } from '../services/api';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  categories: string[];
  onSaveProduct: (productData: Partial<Product>) => Promise<void>;
  currency: string;
}

const SAMPLE_IMAGES = [
  { name: 'Libreta Pasta Dura', url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80' },
  { name: 'Libreta Botánica', url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=80' },
  { name: 'Plumones Pastel', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80' },
  { name: 'Plumas Gel', url: 'https://images.unsplash.com/photo-1585336261026-78b10bbab37d?w=800&auto=format&fit=crop&q=80' },
  { name: 'Washi Tapes Menta', url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80' },
  { name: 'Organizador Escritorio', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80' },
  { name: 'Lápices y Resaltadores', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=80' },
  { name: 'Tote Bag & Accesorios', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80' },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  categories,
  onSaveProduct,
  currency,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories.find(c => c !== 'Todas') || 'Cuadernos');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [price, setPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [comparePrice, setComparePrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(10);
  const [isNew, setIsNew] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  // Multiple designs / photos
  const [designs, setDesigns] = useState<ProductDesign[]>([]);
  const [newDesignName, setNewDesignName] = useState('');
  const [newDesignUrl, setNewDesignUrl] = useState('');
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [replaceUrlInput, setReplaceUrlInput] = useState('');

  // Colors
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#2dd4bf');

  // Formats
  const [formats, setFormats] = useState<string[]>([]);
  const [newFormat, setNewFormat] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setDescription(productToEdit.description || '');
      setCategory(productToEdit.category || categories.find(c => c !== 'Todas') || 'Cuadernos');
      setPrice(productToEdit.price ?? '');
      setCostPrice(productToEdit.costPrice ?? '');
      setComparePrice(productToEdit.comparePrice ?? '');
      setStock(productToEdit.stock ?? 0);
      setIsNew(!!productToEdit.isNew);
      setIsFeatured(!!productToEdit.isFeatured);
      setTagsInput(productToEdit.tags?.join(', ') || '');
      setDesigns(productToEdit.designs || []);
      setColors(productToEdit.colors || []);
      setFormats(productToEdit.formats || []);
    } else {
      setName('');
      setDescription('');
      setCategory(categories.find(c => c !== 'Todas') || 'Cuadernos');
      setPrice('');
      setCostPrice('');
      setComparePrice('');
      setStock(10);
      setIsNew(true);
      setIsFeatured(false);
      setTagsInput('');
      setDesigns([
        {
          id: `des-${Date.now()}`,
          name: 'Diseño Principal',
          imageUrl: SAMPLE_IMAGES[0].url,
        }
      ]);
      setColors([
        { id: `c-1`, name: 'Azul Tiffany', hex: '#0ABAB5' },
        { id: `c-2`, name: 'Rosa Pastel', hex: '#F472B6' },
      ]);
      setFormats(['Estándar']);
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  // Handle local image file upload for new design
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = async (loadEvt) => {
        const rawResult = loadEvt.target?.result as string;
        if (rawResult) {
          const designName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          const tempId = `des-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          
          // Add with instant preview
          setDesigns(prev => [
            ...prev,
            {
              id: tempId,
              name: designName || `Diseño ${prev.length + 1}`,
              imageUrl: rawResult,
            }
          ]);

          // Upload to Supabase Storage to persist permanently
          try {
            const savedUrl = await api.uploadImage(rawResult, file.name);
            if (savedUrl && savedUrl !== rawResult) {
              setDesigns(prev => prev.map(d => d.id === tempId ? { ...d, imageUrl: savedUrl } : d));
            }
          } catch (uploadErr) {
            console.error('No se pudo subir la imagen a Supabase Storage:', uploadErr);
            setFormError('⚠️ La imagen no se pudo subir a almacenamiento en línea. Configura Supabase antes de guardar (ver README.md).');
          }
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Replace image of an existing design slot with a new file
  const handleTriggerReplaceFile = (index: number) => {
    setEditingImageIndex(index);
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.click();
    }
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || editingImageIndex === null) return;
    const targetIndex = editingImageIndex;

    const reader = new FileReader();
    reader.onload = async (loadEvt) => {
      const rawResult = loadEvt.target?.result as string;
      if (rawResult) {
        setDesigns(prev => {
          const updated = [...prev];
          if (updated[targetIndex]) {
            updated[targetIndex] = {
              ...updated[targetIndex],
              imageUrl: rawResult,
            };
          }
          return updated;
        });
        setEditingImageIndex(null);

        // Upload and replace with permanent URL
        try {
          const savedUrl = await api.uploadImage(rawResult, file.name);
          if (savedUrl && savedUrl !== rawResult) {
            setDesigns(prev => {
              const updated = [...prev];
              if (updated[targetIndex]) {
                updated[targetIndex] = {
                  ...updated[targetIndex],
                  imageUrl: savedUrl,
                };
              }
              return updated;
            });
          }
        } catch (uploadErr) {
          console.error('No se pudo subir la imagen a Supabase Storage:', uploadErr);
          setFormError('⚠️ La imagen no se pudo subir a almacenamiento en línea. Configura Supabase antes de guardar (ver README.md).');
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Replace image of an existing design slot with a URL
  const handleApplyReplaceUrl = (index: number) => {
    if (!replaceUrlInput.trim()) return;
    setDesigns(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          imageUrl: replaceUrlInput.trim(),
        };
      }
      return updated;
    });
    setReplaceUrlInput('');
    setEditingImageIndex(null);
  };

  // Add design from URL
  const handleAddDesignFromUrl = () => {
    if (!newDesignUrl.trim()) return;
    setDesigns(prev => [
      ...prev,
      {
        id: `des-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: newDesignName.trim() || `Diseño ${prev.length + 1}`,
        imageUrl: newDesignUrl.trim(),
      }
    ]);
    setNewDesignUrl('');
    setNewDesignName('');
  };

  // Add design from preset
  const handleSelectPresetImage = (preset: { name: string; url: string }) => {
    setDesigns(prev => [
      ...prev,
      {
        id: `des-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: preset.name,
        imageUrl: preset.url,
      }
    ]);
  };

  const handleRemoveDesign = (id: string) => {
    if (designs.length <= 1) {
      alert('El producto debe tener al menos una imagen/diseño.');
      return;
    }
    setDesigns(prev => prev.filter(d => d.id !== id));
  };

  const handleMoveDesign = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= designs.length) return;
    setDesigns(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[newIndex];
      copy[newIndex] = temp;
      return copy;
    });
  };

  // Color handlers
  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    setColors(prev => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        name: newColorName.trim(),
        hex: newColorHex,
      }
    ]);
    setNewColorName('');
  };

  const handleRemoveColor = (id: string) => {
    setColors(prev => prev.filter(c => c.id !== id));
  };

  // Format handlers
  const handleAddFormat = () => {
    if (!newFormat.trim()) return;
    setFormats(prev => [...prev, newFormat.trim()]);
    setNewFormat('');
  };

  const handleRemoveFormat = (index: number) => {
    setFormats(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Por favor ingresa el nombre del producto.');
      return;
    }

    if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
      setFormError('Por favor ingresa un precio válido mayor o igual a 0.');
      return;
    }

    if (designs.length === 0) {
      setFormError('Debes agregar al menos una imagen del producto.');
      return;
    }

    const effectiveCategory = isAddingNewCategory && newCategoryName.trim()
      ? newCategoryName.trim()
      : category;

    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    setIsSaving(true);
    try {
      await onSaveProduct({
        id: productToEdit ? productToEdit.id : undefined,
        name: name.trim(),
        description: description.trim(),
        category: effectiveCategory,
        price: Number(price),
        costPrice: costPrice !== '' ? Number(costPrice) : undefined,
        comparePrice: comparePrice !== '' ? Number(comparePrice) : undefined,
        stock: stock !== '' ? Number(stock) : 0,
        isNew,
        isFeatured,
        tags: parsedTags,
        designs,
        colors,
        formats,
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Ocurrió un error al guardar el producto.');
    } finally {
      setIsSaving(false);
    }
  };

  const calculatedProfit = (typeof price === 'number' && typeof costPrice === 'number' && price > 0)
    ? (price - costPrice)
    : null;
  const profitMarginPercent = (calculatedProfit !== null && typeof price === 'number' && price > 0)
    ? Math.round((calculatedProfit / price) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn no-print">
      <div 
        id="product-form-modal"
        className="relative bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-teal-100 flex flex-col max-h-[92vh]"
      >
        {/* Hidden file input for changing existing photos */}
        <input
          ref={replaceFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleReplaceFileChange}
        />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-teal-100 bg-gradient-to-r from-teal-50 via-rose-50/40 to-teal-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500 text-white shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {productToEdit ? 'Editar Producto del Catálogo' : 'Agregar Nuevo Producto'}
              </h3>
              <p className="text-xs text-teal-700 font-medium">
                Edita fotos, costos, precio de venta, ganancia, stock, categoría y variantes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-teal-100 text-slate-500 hover:text-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl animate-fadeIn">
              {formError}
            </div>
          )}
          
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Name */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nombre del Producto <span className="text-rose-500">*</span>
              </label>
              <input
                id="product-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Peluche Osito Menta Tiffany / Libreta Bonita"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 font-semibold"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Pestaña / Categoría <span className="text-rose-500">*</span>
              </label>
              {!isAddingNewCategory ? (
                <div className="flex gap-2">
                  <select
                    id="product-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium"
                  >
                    {categories.filter(c => c !== 'Todas').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCategory(true)}
                    className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold border border-teal-200"
                  >
                    + Nueva
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nombre nueva categoría"
                    className="flex-1 px-3 py-2 bg-white border border-teal-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCategory(false)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Stock */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Cantidad en Existencia (Stock) <span className="text-rose-500">*</span>
              </label>
              <input
                id="product-stock-input"
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="10"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 font-bold"
              />
            </div>

            {/* Financials: Cost vs Selling Price & Profit preview */}
            <div className="md:col-span-2 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Cost Price */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Costo / Inversión ({currency})
                  <span className="text-[11px] text-slate-500 font-normal ml-1">(¿Cuánto te costó?)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    {currency}
                  </span>
                  <input
                    id="product-cost-price-input"
                    type="number"
                    step="0.5"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="75.00"
                    className="w-full pl-8 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Selling Price */}
              <div>
                <label className="text-xs font-bold text-teal-900 block mb-1">
                  Precio de Venta ({currency}) <span className="text-rose-500">*</span>
                  <span className="text-[11px] text-teal-700 font-normal ml-1">(¿En cuánto se vende?)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-teal-600 text-sm">
                    {currency}
                  </span>
                  <input
                    id="product-price-input"
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="145.00"
                    className="w-full pl-8 pr-3.5 py-2 bg-white border border-teal-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-bold text-teal-900"
                  />
                </div>
              </div>

              {/* Profit preview card */}
              <div className="bg-gradient-to-br from-teal-50 to-rose-50 border border-teal-200 rounded-xl p-2.5 flex flex-col justify-center">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Ganancia por Pieza
                </span>
                {calculatedProfit !== null ? (
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className={`text-base font-extrabold ${calculatedProfit >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                      {currency}{calculatedProfit.toFixed(2)}
                    </span>
                    {profitMarginPercent !== null && (
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-white/90 text-rose-700 border border-rose-200">
                        {profitMarginPercent}% margen
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Ingresa costo y precio</span>
                )}
              </div>
            </div>

            {/* Compare / Normal Price (for discounts) */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Precio Anterior / Tachado ({currency}) <span className="text-slate-400 font-normal">(Opcional, para mostrar oferta)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                  {currency}
                </span>
                <input
                  id="product-compare-price-input"
                  type="number"
                  step="0.5"
                  min="0"
                  value={comparePrice}
                  onChange={(e) => setComparePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="170.00"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600"
                />
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Descripción del Producto
              </label>
              <textarea
                id="product-description-input"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalla materiales, medidas, número de hojas, tipo de punta o características especiales..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
              />
            </div>

          </div>

          {/* SECTION: MULTIPLE DESIGNS / PHOTOS WITH CHANGE/REPLACE CAPABILITY */}
          <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-teal-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-600" />
                  Fotos y Diseños del Producto ({designs.length})
                </h4>
                <p className="text-xs text-teal-700">
                  Puedes cambiar o actualizar cualquier foto en cualquier momento, reordenarlas o subir nuevas fotos.
                </p>
              </div>
            </div>

            {/* Existing Designs List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {designs.map((des, index) => (
                <div 
                  key={des.id || index}
                  className={`bg-white rounded-2xl border ${index === 0 ? 'border-teal-400 ring-2 ring-teal-200/50' : 'border-teal-200'} p-2.5 flex flex-col justify-between shadow-2xs group relative transition`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Thumbnail with overlay change button */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 group/img">
                      <img
                        src={des.imageUrl}
                        alt={des.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => handleTriggerReplaceFile(index)}
                        className="absolute inset-0 bg-slate-900/70 hover:bg-slate-900/80 text-white flex flex-col items-center justify-center opacity-0 group-hover/img:opacity-100 transition text-[9px] font-bold p-1 text-center"
                        title="Cambiar foto de este diseño"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mb-0.5 animate-spin-hover" />
                        <span>Cambiar</span>
                      </button>
                    </div>

                    {/* Design name & info */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={des.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setDesigns(prev => prev.map(d => d.id === des.id ? { ...d, name: newName } : d));
                        }}
                        placeholder="Nombre de diseño"
                        className="w-full text-xs font-bold text-slate-800 bg-transparent border-b border-slate-200 focus:border-teal-400 focus:outline-none pb-0.5"
                      />
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${index === 0 ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'}`}>
                          {index === 0 ? '⭐ Foto Portada' : `#${index + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTriggerReplaceFile(index)}
                          className="text-[10px] font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-0.5"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          Cambiar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer on card */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-slate-400">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveDesign(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:text-teal-700 disabled:opacity-20 transition"
                        title="Mover arriba / hacer portada"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDesign(index, 'down')}
                        disabled={index === designs.length - 1}
                        className="p-1 hover:text-teal-700 disabled:opacity-20 transition"
                        title="Mover abajo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDesign(des.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 transition"
                      title="Eliminar este diseño"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Photo / Design Controls */}
            <div className="pt-2 border-t border-teal-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Local File Upload Button */}
              <div>
                <label className="text-xs font-semibold text-teal-900 block mb-1">
                  1. Subir fotos desde tu computadora/celular:
                </label>
                <label className="cursor-pointer w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-teal-300 hover:border-teal-500 bg-white hover:bg-teal-50 text-teal-800 text-xs font-bold flex items-center justify-center gap-2 transition">
                  <Upload className="w-4 h-4 text-teal-600" />
                  Seleccionar foto(s)
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* URL or Presets */}
              <div>
                <label className="text-xs font-semibold text-teal-900 block mb-1">
                  2. O pegar enlace directo de imagen:
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    value={newDesignUrl}
                    onChange={(e) => setNewDesignUrl(e.target.value)}
                    placeholder="https://ejemplo.com/foto.jpg"
                    className="flex-1 px-3 py-1.5 bg-white border border-teal-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddDesignFromUrl}
                    disabled={!newDesignUrl.trim()}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold disabled:opacity-40"
                  >
                    + Agregar
                  </button>
                </div>

                {/* Preset quick links */}
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[10px] text-teal-700 font-semibold shrink-0">Ejemplos:</span>
                  {SAMPLE_IMAGES.slice(0, 4).map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleSelectPresetImage(preset)}
                      className="text-[10px] bg-white hover:bg-teal-100 border border-teal-200 text-teal-800 px-2 py-0.5 rounded-md whitespace-nowrap"
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* SECTION: COLORS */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-slate-600" />
                Colores Disponibles ({colors.length})
              </h4>
            </div>

            <div className="flex flex-wrap gap-2">
              {colors.map(col => (
                <div 
                  key={col.id} 
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-2xs"
                >
                  <span 
                    className="w-4 h-4 rounded-full border border-slate-300"
                    style={{ backgroundColor: col.hex }}
                  />
                  <span className="text-xs font-bold text-slate-700">{col.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(col.id)}
                    className="text-slate-300 hover:text-rose-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 items-center pt-2">
              <input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-9 h-9 rounded-xl border border-slate-300 p-0.5 cursor-pointer bg-white shrink-0"
              />
              <input
                type="text"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Nombre del color (ej. Menta Pastel)"
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
              <button
                type="button"
                onClick={handleAddColor}
                disabled={!newColorName.trim()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-40"
              >
                + Añadir Color
              </button>
            </div>
          </div>

          {/* SECTION: FORMATS & PRESENTATIONS */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-600" />
              Formatos o Variantes ({formats.length})
            </h4>

            <div className="flex flex-wrap gap-2">
              {formats.map((fmt, index) => (
                <div 
                  key={index}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 flex items-center gap-2 shadow-2xs"
                >
                  <span className="text-xs font-medium text-slate-700">{fmt}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFormat(index)}
                    className="text-slate-300 hover:text-rose-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 items-center pt-2">
              <input
                type="text"
                value={newFormat}
                onChange={(e) => setNewFormat(e.target.value)}
                placeholder="Ej. A5 Raya, Estuche 12 Colores, Pieza Individual..."
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
              <button
                type="button"
                onClick={handleAddFormat}
                disabled={!newFormat.trim()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-40"
              >
                + Añadir Formato
              </button>
            </div>
          </div>

          {/* Tags & Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Etiquetas / Palabras Clave (separadas por coma)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="cuaderno, pastel, bullet journal, maped"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>

            <div className="flex items-center gap-6 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNew}
                  onChange={(e) => setIsNew(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-400 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700">Etiqueta "Nuevo"</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-400 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700">Destacar en Portada</span>
              </label>
            </div>
          </div>

          {/* Sticky Submit Button in Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm transition"
            >
              Cancelar
            </button>
            <button
              id="save-product-submit-btn"
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : (productToEdit ? 'Actualizar Producto' : 'Guardar en Catálogo')}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
