import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Bookmark, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  DollarSign, 
  Receipt, 
  MessageCircle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  X, 
  Lock, 
  Unlock, 
  Sparkles,
  AlertCircle,
  Phone,
  User,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  RotateCcw,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Download,
  FolderTree,
  Coins,
  ArrowRight,
  PlusCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product, Apartado, StoreConfig, ApartadoStatus } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  apartados: Apartado[];
  config: StoreConfig;
  currency: string;
  onOpenNewProductModal: () => void;
  onOpenEditProductModal: (product: Product) => void;
  onSaveProduct?: (productData: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onQuickStockChange: (id: string, delta: number) => Promise<void>;
  onOpenAbonoModal: (apartado: Apartado) => void;
  onOpenManualApartadoModal: () => void;
  onUpdateApartadoStatus: (id: string, status: ApartadoStatus) => Promise<void>;
  onDeleteApartado: (id: string) => Promise<void>;
  onUpdateConfig: (newConfig: Partial<StoreConfig>) => Promise<void>;
  onDeleteCategory: (categoryName: string) => Promise<void>;
  onOpenAddProductToApartado: (apartado: Apartado) => void;
  onResetToDefaults: () => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  products,
  apartados,
  config,
  currency,
  onOpenNewProductModal,
  onOpenEditProductModal,
  onSaveProduct,
  onDeleteProduct,
  onQuickStockChange,
  onOpenAbonoModal,
  onOpenManualApartadoModal,
  onUpdateApartadoStatus,
  onDeleteApartado,
  onUpdateConfig,
  onDeleteCategory,
  onOpenAddProductToApartado,
  onResetToDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'apartados' | 'inventory' | 'sales_report' | 'settings'>('apartados');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('Todas');
  const [apartadoFilter, setApartadoFilter] = useState<'all' | 'pending' | 'liquidated' | 'delivered'>('all');
  const [apartadoSearch, setApartadoSearch] = useState('');

  // Settings local state
  const [storeName, setStoreName] = useState(config.storeName);
  const [tagline, setTagline] = useState(config.tagline);
  const [announcementBanner, setAnnouncementBanner] = useState(config.announcementBanner);
  const [whatsappNumber, setWhatsappNumber] = useState(config.whatsappNumber);
  const [adminPin, setAdminPin] = useState(config.adminPin || '1029');
  const [themePreference, setThemePreference] = useState<'tiffany-rose' | 'rosa' | 'tiffany'>(config.themePreference || 'tiffany-rose');
  const [showPin, setShowPin] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSavedSuccess, setConfigSavedSuccess] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [remisionApartado, setRemisionApartado] = useState<Apartado | null>(null);
  const [isDownloadingRemision, setIsDownloadingRemision] = useState(false);
  const remisionRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadRemisionImage = async () => {
    if (!remisionApartado) return;
    setIsDownloadingRemision(true);
    try {
      const { folio, relacionados } = getRemisionGroup(remisionApartado);
      const monthLabelRaw = new Date(remisionApartado.createdAt).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
      const monthLabel = monthLabelRaw.charAt(0).toUpperCase() + monthLabelRaw.slice(1);
      const totalGeneral = relacionados.reduce((sum, a) => sum + a.totalPrice, 0);
      const totalAbonadoGeneral = relacionados.reduce((sum, a) => sum + a.totalAbonado, 0);
      const saldoGeneral = relacionados.reduce((sum, a) => sum + a.saldoPendiente, 0);

      const rows = relacionados.map(apt => {
        const items = apt.items && apt.items.length > 0 ? apt.items : [{
          id: `legacy-${apt.id}`,
          productName: apt.productName,
          quantity: apt.quantity,
          subtotal: apt.totalPrice,
        }];
        return {
          date: new Date(apt.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).toUpperCase(),
          lines: items.map(item => ({
            text: `${item.productName} x${item.quantity}`,
            amount: `${currency}${Number(item.subtotal ?? 0).toFixed(2)}`,
          })),
        };
      });

      // Aseguramos que la tipografía elegante ya esté cargada antes de dibujar
      try {
        await document.fonts.load('64px "Mrs Saint Delafield"');
        await document.fonts.ready;
      } catch { /* si falla, seguimos con la fuente por defecto */ }

      const scale = 2;
      const width = 500;
      const padding = 32;

      // Calculamos la altura total necesaria
      let height = padding * 2 + 70 + 26 + 20 + 46 + 20 + 46;
      rows.forEach(r => { height += 18 + r.lines.length * 20 + 8; });
      height += 20 + 90;

      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo crear el lienzo');
      ctx.scale(scale, scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      let cy = padding;

      // Título
      ctx.textAlign = 'center';
      ctx.fillStyle = '#115e59';
      ctx.font = '54px "Mrs Saint Delafield", cursive';
      ctx.fillText(config.storeName, width / 2, cy + 40);
      cy += 62;
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('N O T A   D E   R E M I S I Ó N', width / 2, cy);
      cy += 18;

      // Línea punteada
      ctx.strokeStyle = '#99f6e4';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, cy);
      ctx.lineTo(width - padding, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      cy += 18;

      // Caja de Folio / Corte
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.fillRect(padding, cy, width - padding * 2, 36);
      ctx.strokeRect(padding, cy, width - padding * 2, 36);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'left';
      ctx.fillText(`Folio: #${String(folio).padStart(4, '0')}`, padding + 12, cy + 23);
      ctx.textAlign = 'right';
      ctx.fillText(`Corte: ${monthLabel}`, width - padding - 12, cy + 23);
      cy += 56;

      // Cliente
      ctx.textAlign = 'left';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(remisionApartado.clientName, padding, cy);
      cy += 18;
      if (remisionApartado.clientPhone) {
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(remisionApartado.clientPhone, padding, cy);
        cy += 16;
      }
      cy += 10;

      // Pedidos del mes
      rows.forEach((r) => {
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText(r.date, padding, cy);
        cy += 16;
        r.lines.forEach((line) => {
          ctx.font = '11px sans-serif';
          ctx.fillStyle = '#334155';
          ctx.textAlign = 'left';
          ctx.fillText(line.text, padding, cy);
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(line.amount, width - padding, cy);
          cy += 20;
        });
        cy += 8;
      });

      // Línea punteada
      ctx.strokeStyle = '#99f6e4';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, cy);
      ctx.lineTo(width - padding, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      cy += 24;

      const drawTotalLine = (label: string, value: string, color: string, size = 13) => {
        ctx.textAlign = 'left';
        ctx.font = `bold ${size}px sans-serif`;
        ctx.fillStyle = color;
        ctx.fillText(label, padding, cy);
        ctx.textAlign = 'right';
        ctx.fillText(value, width - padding, cy);
        cy += size + 10;
      };

      drawTotalLine('Total del mes:', `${currency}${totalGeneral.toFixed(2)}`, '#334155');
      drawTotalLine('Abonado:', `${currency}${totalAbonadoGeneral.toFixed(2)}`, '#0f766e');
      cy += 4;
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, cy);
      ctx.lineTo(width - padding, cy);
      ctx.stroke();
      cy += 20;
      drawTotalLine('Saldo pendiente:', `${currency}${saldoGeneral.toFixed(2)}`, '#e11d48', 16);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Nota_Remision_${remisionApartado.clientName.replace(/\s+/g, '_')}.png`;
      link.click();
    } catch (err) {
      console.error('Error generando imagen de la nota:', err);
      alert('No se pudo generar la imagen. Intenta de nuevo.');
    } finally {
      setIsDownloadingRemision(false);
    }
  };

  // Nota de Remisión: agrupa por cliente + mes (corte mensual, acumulativo dentro del mismo mes)
  const getClientKey = (a: Apartado) => (a.clientPhone && a.clientPhone.trim()) || a.clientName.trim().toLowerCase();
  const getMonthKey = (a: Apartado) => (a.createdAt || '').slice(0, 7); // "AAAA-MM"

  const folioMap = useMemo(() => {
    const groups = new Map<string, string>(); // key -> fecha más antigua
    apartados.forEach(a => {
      if (a.status === 'cancelado') return;
      const key = `${getClientKey(a)}|${getMonthKey(a)}`;
      const existing = groups.get(key);
      if (!existing || a.createdAt < existing) {
        groups.set(key, a.createdAt);
      }
    });
    const ordered = Array.from(groups.entries()).sort((x, y) => x[1].localeCompare(y[1]));
    const map = new Map<string, number>();
    ordered.forEach(([key], idx) => map.set(key, idx + 1));
    return map;
  }, [apartados]);

  const getRemisionGroup = (apt: Apartado) => {
    const key = `${getClientKey(apt)}|${getMonthKey(apt)}`;
    const folio = folioMap.get(key) || 1;
    const relacionados = apartados
      .filter(a => a.status !== 'cancelado' && `${getClientKey(a)}|${getMonthKey(a)}` === key)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { folio, relacionados };
  };

  if (!isOpen) return null;

  // Financial calculations
  const totalDeudaGlobal = apartados
    .filter(a => a.status !== 'cancelado' && a.status !== 'entregado')
    .reduce((sum, a) => sum + (a.saldoPendiente || 0), 0);

  const totalRecaudadoAbonos = apartados
    .filter(a => a.status !== 'cancelado')
    .reduce((sum, a) => sum + (a.totalAbonado || 0), 0);

  const totalApartadosActivos = apartados
    .filter(a => a.status === 'apartado' || a.status === 'pagado_parcial')
    .length;

  const totalLiquidadosListos = apartados
    .filter(a => a.status === 'liquidado')
    .length;

  // Inventory financial totals
  const totalInversionInventario = products.reduce((sum, p) => {
    const cost = p.costPrice ?? (p.price * 0.5); // fallback estimate if not set
    return sum + (cost * p.stock);
  }, 0);

  const totalValorVentaInventario = products.reduce((sum, p) => {
    return sum + (p.price * p.stock);
  }, 0);

  const totalGananciaPotencialInventario = totalValorVentaInventario - totalInversionInventario;

  // Sales and profit analysis by day
  const salesByDayMap = new Map<string, {
    date: string;
    itemsCount: number;
    totalVenta: number;
    totalInversion: number;
    totalRecaudado: number;
    gananciaEstimada: number;
    apartadosList: Apartado[];
  }>();

  apartados.forEach(apt => {
    if (apt.status === 'cancelado') return;
    const dateKey = apt.createdAt ? apt.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
    
    // Find cost
    const matchingProd = products.find(p => p.id === apt.productId);
    const unitCost = matchingProd?.costPrice ?? (apt.unitPrice * 0.5);
    const totalCost = unitCost * (apt.quantity || 1);
    const totalVenta = apt.totalPrice;
    const ganancia = totalVenta - totalCost;

    if (!salesByDayMap.has(dateKey)) {
      salesByDayMap.set(dateKey, {
        date: dateKey,
        itemsCount: 0,
        totalVenta: 0,
        totalInversion: 0,
        totalRecaudado: 0,
        gananciaEstimada: 0,
        apartadosList: [],
      });
    }

    const dayData = salesByDayMap.get(dateKey)!;
    dayData.itemsCount += (apt.quantity || 1);
    dayData.totalVenta += totalVenta;
    dayData.totalInversion += totalCost;
    dayData.totalRecaudado += apt.totalAbonado;
    dayData.gananciaEstimada += ganancia;
    dayData.apartadosList.push(apt);
  });

  const dailySalesReport = Array.from(salesByDayMap.values()).sort((a, b) => b.date.localeCompare(a.date));

  const totalGananciaVentasRealizadas = dailySalesReport.reduce((sum, d) => sum + d.gananciaEstimada, 0);
  const totalInversionVentasRealizadas = dailySalesReport.reduce((sum, d) => sum + d.totalInversion, 0);
  const totalVentasRegistradas = dailySalesReport.reduce((sum, d) => sum + d.totalVenta, 0);

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(productSearch.toLowerCase()));
    const matchesCategory = productCategoryFilter === 'Todas' || productCategoryFilter === 'Todos' || p.category === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filtered Apartados
  const filteredApartados = apartados.filter(a => {
    const matchesSearch = a.clientName.toLowerCase().includes(apartadoSearch.toLowerCase()) ||
      a.productName.toLowerCase().includes(apartadoSearch.toLowerCase()) ||
      a.clientNote.toLowerCase().includes(apartadoSearch.toLowerCase()) ||
      (a.clientPhone && a.clientPhone.includes(apartadoSearch));

    if (!matchesSearch) return false;

    if (apartadoFilter === 'pending') {
      return a.saldoPendiente > 0 && a.status !== 'cancelado';
    }
    if (apartadoFilter === 'liquidated') {
      return a.status === 'liquidado';
    }
    if (apartadoFilter === 'delivered') {
      return a.status === 'entregado';
    }
    return true;
  });

  // Quick category change for a product to relocate into corresponding tab
  const handleQuickCategoryChange = async (productId: string, newCat: string) => {
    if (onSaveProduct) {
      const existing = products.find(p => p.id === productId);
      if (existing) {
        await onSaveProduct({
          ...existing,
          category: newCat,
        });
      }
    }
  };

  // Export Complete Excel Report (.xlsx)
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Sheet: Ventas por Día & Ganancias
      const dailyDataForExcel = dailySalesReport.map(d => ({
        'Fecha (Año-Mes-Día)': d.date,
        'Artículos Vendidos / Apartados': d.itemsCount,
        'Inversión / Costo Total ($)': Number(d.totalInversion.toFixed(2)),
        'Venta Total ($)': Number(d.totalVenta.toFixed(2)),
        'Total Recaudado en Abonos ($)': Number(d.totalRecaudado.toFixed(2)),
        'Ganancia Neta Estimada ($)': Number(d.gananciaEstimada.toFixed(2)),
        'Margen de Ganancia (%)': d.totalVenta > 0 ? `${Math.round((d.gananciaEstimada / d.totalVenta) * 100)}%` : '0%',
      }));

      // If empty, add placeholder
      const wsDaily = XLSX.utils.json_to_sheet(dailyDataForExcel.length > 0 ? dailyDataForExcel : [
        { 'Mensaje': 'Aún no hay ventas o apartados registrados.' }
      ]);
      XLSX.utils.book_append_sheet(wb, wsDaily, 'Ventas por Día');

      // 2. Sheet: Detalle de Apartados & Clientes
      const apartadosDataForExcel = apartados.map(a => {
        const prod = products.find(p => p.id === a.productId);
        const unitCost = prod?.costPrice ?? (a.unitPrice * 0.5);
        const totalCost = unitCost * (a.quantity || 1);
        const ganancia = a.totalPrice - totalCost;

        return {
          'Folio / ID': a.id,
          'Fecha': a.createdAt ? a.createdAt.slice(0, 10) : '',
          'Cliente': a.clientName,
          'Teléfono': a.clientPhone || 'No registrado',
          'Notas': a.clientNote || '',
          'Producto': a.productName,
          'Diseño': a.selectedDesign || 'Estándar',
          'Color': a.selectedColor || '',
          'Formato / Tamaño': a.selectedFormat || '',
          'Cantidad': a.quantity,
          'Costo Unitario ($)': Number(unitCost.toFixed(2)),
          'Precio Venta Unitario ($)': Number(a.unitPrice.toFixed(2)),
          'Total Venta ($)': Number(a.totalPrice.toFixed(2)),
          'Total Inversión ($)': Number(totalCost.toFixed(2)),
          'Ganancia Estimada ($)': Number(ganancia.toFixed(2)),
          'Total Abonado ($)': Number(a.totalAbonado.toFixed(2)),
          'Saldo Pendiente ($)': Number(a.saldoPendiente.toFixed(2)),
          'Estado': a.status.toUpperCase(),
        };
      });

      const wsApartados = XLSX.utils.json_to_sheet(apartadosDataForExcel.length > 0 ? apartadosDataForExcel : [
        { 'Mensaje': 'Sin apartados registrados.' }
      ]);
      XLSX.utils.book_append_sheet(wb, wsApartados, 'Detalle Apartados');

      // 3. Sheet: Inventario, Costos & Stock Actual
      const inventoryDataForExcel = products.map(p => {
        const cost = p.costPrice ?? 0;
        const totalInv = cost * p.stock;
        const totalRetail = p.price * p.stock;
        const potProfit = totalRetail - totalInv;

        return {
          'Producto': p.name,
          'Pestaña / Categoría': p.category,
          'Existencias (Stock)': p.stock,
          'Costo Unitario ($)': Number(cost.toFixed(2)),
          'Precio Venta ($)': Number(p.price.toFixed(2)),
          'Ganancia por Pieza ($)': Number((p.price - cost).toFixed(2)),
          'Margen Unitario (%)': p.price > 0 ? `${Math.round(((p.price - cost) / p.price) * 100)}%` : '0%',
          'Inversión Total en Stock ($)': Number(totalInv.toFixed(2)),
          'Valor Total de Venta en Stock ($)': Number(totalRetail.toFixed(2)),
          'Ganancia Potencial en Stock ($)': Number(potProfit.toFixed(2)),
        };
      });

      const wsInventory = XLSX.utils.json_to_sheet(inventoryDataForExcel);
      XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventario y Costos');

      const fileName = `Reporte_Ventas_y_Ganancias_${config.storeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Error exporting Excel:', err);
      alert('Hubo un error al generar el archivo Excel.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await onUpdateConfig({
        storeName: storeName.trim(),
        tagline: tagline.trim(),
        announcementBanner: announcementBanner.trim(),
        whatsappNumber: whatsappNumber.trim(),
        adminPin: adminPin.trim(),
        themePreference,
      });
      setConfigSavedSuccess(true);
      setTimeout(() => setConfigSavedSuccess(false), 3000);
    } catch (err) {
      alert('Error guardando la configuración');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSendWhatsAppReminder = (apartado: Apartado) => {
    const phone = apartado.clientPhone ? apartado.clientPhone.replace(/\D/g, '') : '';
    let msg = `🌸 *Hola ${apartado.clientName}, te saludamos de ${config.storeName}:*\n\n` +
      `Te recordamos con mucho cariño tu apartado de:\n` +
      `📦 *${apartado.productName}*\n`;
    if (apartado.selectedDesign) msg += `🎨 *Diseño:* ${apartado.selectedDesign}\n`;
    msg += `💰 *Total del producto:* ${currency}${apartado.totalPrice.toFixed(2)}\n` +
      `💵 *Total que has abonado:* ${currency}${apartado.totalAbonado.toFixed(2)}\n` +
      `⏳ *Saldo pendiente por pagar:* ${currency}${apartado.saldoPendiente.toFixed(2)}\n\n`;

    if (apartado.saldoPendiente === 0) {
      msg += `🎉 *¡Tu producto está totalmente liquidado!* Ya puedes pasar a recogerlo en el momento que gustes.`;
    } else {
      msg += `¿Te gustaría registrar un abono o pasar por él? Quedamos a tus órdenes. ¡Que tengas un excelente día!`;
    }

    const url = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` 
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn no-print">
      <div 
        id="admin-panel-modal"
        className="bg-white rounded-3xl w-full max-w-6xl h-[94vh] shadow-2xl border border-teal-100 flex flex-col overflow-hidden"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-teal-100 bg-gradient-to-r from-teal-900 via-teal-800 to-rose-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Panel de Administración
                </h2>
                <span className="text-[10px] uppercase font-extrabold bg-gradient-to-r from-teal-400 to-rose-400 text-slate-950 px-2.5 py-0.5 rounded-md shadow-2xs">
                  Tiffany & Rosa
                </span>
              </div>
              <p className="text-xs text-teal-200">
                {config.storeName} &bull; Control de Ventas, Ganancias, Inversión e Inventario
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Excel Download Button in Header */}
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Descargar Excel con Ventas por día, Inversión y Ganancias"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar Excel Ventas</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gradient-to-r from-teal-50/90 via-rose-50/40 to-teal-50/90 px-4 sm:px-6 pt-3 border-b border-teal-100 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            
            {/* Apartados Tab */}
            <button
              id="admin-tab-apartados"
              onClick={() => setActiveTab('apartados')}
              className={`pb-3 px-3.5 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'apartados'
                  ? 'border-teal-600 text-teal-950 font-black'
                  : 'border-transparent text-slate-500 hover:text-teal-800'
              }`}
            >
              <Bookmark className="w-4 h-4 text-teal-600" />
              <span>Control de Apartados</span>
              {totalApartadosActivos > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                  {totalApartadosActivos}
                </span>
              )}
            </button>

            {/* Sales & Profit Report Tab */}
            <button
              id="admin-tab-sales-report"
              onClick={() => setActiveTab('sales_report')}
              className={`pb-3 px-3.5 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'sales_report'
                  ? 'border-rose-500 text-rose-950 font-black'
                  : 'border-transparent text-slate-500 hover:text-rose-800'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <span>Ventas por Día & Ganancia</span>
              <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                Excel
              </span>
            </button>

            {/* Inventory Tab */}
            <button
              id="admin-tab-inventory"
              onClick={() => setActiveTab('inventory')}
              className={`pb-3 px-3.5 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'border-teal-600 text-teal-950 font-black'
                  : 'border-transparent text-slate-500 hover:text-teal-800'
              }`}
            >
              <Package className="w-4 h-4 text-teal-600" />
              <span>Inventario y Pestañas</span>
              <span className="bg-teal-100 text-teal-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {products.length}
              </span>
            </button>

            {/* Settings Tab */}
            <button
              id="admin-tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`pb-3 px-3.5 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-teal-600 text-teal-950 font-black'
                  : 'border-transparent text-slate-500 hover:text-teal-800'
              }`}
            >
              <Settings className="w-4 h-4 text-teal-600" />
              <span>Ajustes de Tienda</span>
            </button>

          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          
          {/* ===================== TAB 1: APARTADOS Y DEUDAS ===================== */}
          {activeTab === 'apartados' && (
            <div className="space-y-6">
              
              {/* Metric Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Deuda Total Pendiente */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-rose-100 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block mb-1">
                      Deuda Total por Cobrar
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-rose-600">
                      {currency}{totalDeudaGlobal.toFixed(2)}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Suma de saldos pendientes de clientes
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                {/* Total Recaudado en Abonos */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-teal-100 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-1">
                      Total Recaudado
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-teal-800">
                      {currency}{totalRecaudadoAbonos.toFixed(2)}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Dinero recibido en anticipos y abonos
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                    <Receipt className="w-6 h-6" />
                  </div>
                </div>

                {/* Apartados Activos y Listos */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-teal-100 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Estado de Entregas
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-slate-900">
                        {totalApartadosActivos}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">pendientes</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-2xl font-black text-emerald-600">
                        {totalLiquidadosListos}
                      </span>
                      <span className="text-xs text-emerald-600 font-bold">liquidados</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Listos para entrega a clientas
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>

              </div>

              {/* Action & Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-teal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={apartadoSearch}
                    onChange={(e) => setApartadoSearch(e.target.value)}
                    placeholder="Buscar por cliente, producto, teléfono o nota..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  <button
                    onClick={() => setApartadoFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      apartadoFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todos ({apartados.length})
                  </button>
                  <button
                    onClick={() => setApartadoFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      apartadoFilter === 'pending'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Con Saldo ({apartados.filter(a => a.saldoPendiente > 0 && a.status !== 'cancelado').length})
                  </button>
                  <button
                    onClick={() => setApartadoFilter('liquidated')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      apartadoFilter === 'liquidated'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Liquidados ({totalLiquidadosListos})
                  </button>
                  <button
                    onClick={() => setApartadoFilter('delivered')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      apartadoFilter === 'delivered'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    Entregados
                  </button>
                </div>

                {/* Export & Manual add */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportExcel}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold shadow-2xs transition flex items-center justify-center gap-1.5 shrink-0"
                    title="Exportar a Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Excel</span>
                  </button>

                  <button
                    onClick={onOpenManualApartadoModal}
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    + Registrar Apartado
                  </button>
                </div>

              </div>

              {/* Apartados Cards Grid */}
              {filteredApartados.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-teal-100">
                  <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-400 flex items-center justify-center mx-auto mb-3">
                    <Bookmark className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">No se encontraron apartados</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    No hay apartados registrados con los filtros seleccionados. Puedes registrar un nuevo apartado manualmente.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredApartados.map((apt) => {
                    const isLiquidado = apt.saldoPendiente === 0;
                    const percentPaid = apt.totalPrice > 0 
                      ? Math.min(100, Math.round((apt.totalAbonado / apt.totalPrice) * 100)) 
                      : 100;

                    return (
                      <div 
                        key={apt.id}
                        className={`bg-white rounded-3xl p-4 sm:p-5 border transition flex flex-col justify-between shadow-xs ${
                          apt.status === 'cancelado' 
                            ? 'border-slate-200 opacity-60' 
                            : isLiquidado
                            ? 'border-emerald-200 ring-1 ring-emerald-100'
                            : 'border-rose-200/80 hover:border-rose-300'
                        }`}
                      >
                        <div>
                          {/* Client Header */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-400 to-rose-300 flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-2xs">
                                {apt.clientName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                                  {apt.clientName}
                                </h4>
                                {apt.clientPhone && (
                                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-0.5">
                                    <Phone className="w-3 h-3 text-teal-600" />
                                    <span>{apt.clientPhone}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Status Badge */}
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              apt.status === 'liquidado'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : apt.status === 'entregado'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : apt.status === 'cancelado'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {apt.status === 'pagado_parcial' ? 'En Abonos' : apt.status}
                            </span>
                          </div>

                          {/* Client Note */}
                          {apt.clientNote && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 mb-3 flex items-start gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span className="italic">{apt.clientNote}</span>
                            </div>
                          )}

                          {/* Product Info (uno o varios productos en la misma cuenta) */}
                          <div className="space-y-2 mb-3">
                            {(apt.items && apt.items.length > 0 ? apt.items : [{
                              id: `legacy-${apt.id}`,
                              productImage: apt.productImage,
                              productName: apt.productName,
                              selectedDesign: apt.selectedDesign,
                              selectedColor: apt.selectedColor,
                              selectedFormat: apt.selectedFormat,
                              quantity: apt.quantity,
                            }]).map((item) => (
                              <div key={item.id} className="flex items-center gap-3 p-3 bg-teal-50/40 rounded-2xl border border-teal-100">
                                {item.productImage && (
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-2xs shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                    {item.productName}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-teal-800 flex-wrap mt-0.5">
                                    {item.selectedDesign && <span>🎨 {item.selectedDesign}</span>}
                                    {item.selectedColor && <span>🌈 {item.selectedColor}</span>}
                                    {item.selectedFormat && <span>📐 {item.selectedFormat}</span>}
                                    <span className="font-bold text-slate-700">Cant: {item.quantity}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {apt.status !== 'cancelado' && (
                              <button
                                type="button"
                                onClick={() => onOpenAddProductToApartado(apt)}
                                className="w-full py-2 rounded-xl border border-dashed border-teal-300 text-teal-700 text-xs font-bold hover:bg-teal-50 transition flex items-center justify-center gap-1.5"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Agregar otro producto a esta cuenta
                              </button>
                            )}
                          </div>

                          {/* Progress Bar & Financials */}
                          <div className="space-y-2 mb-3">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-600">Total: {currency}{apt.totalPrice.toFixed(2)}</span>
                              <span className="text-teal-700">Abonado: {currency}{apt.totalAbonado.toFixed(2)} ({percentPaid}%)</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                              <div 
                                className={`h-full transition-all duration-500 rounded-full ${
                                  isLiquidado ? 'bg-emerald-500' : 'bg-gradient-to-r from-teal-400 to-rose-400'
                                }`}
                                style={{ width: `${percentPaid}%` }}
                              />
                            </div>
                          </div>

                          {/* Saldo Pendiente Big Callout */}
                          <div className={`p-3 rounded-2xl flex items-center justify-between ${
                            isLiquidado 
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-950 border border-rose-200'
                          }`}>
                            <div className="flex items-center gap-2">
                              {isLiquidado ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                              )}
                              <span className="text-xs font-bold">
                                {isLiquidado ? '¡Totalmente Liquidado!' : 'Saldo Pendiente por Pagar:'}
                              </span>
                            </div>
                            <span className="text-base sm:text-lg font-black">
                              {currency}{apt.saldoPendiente.toFixed(2)}
                            </span>
                          </div>

                          {/* Abonos History Mini */}
                          {apt.abonos && apt.abonos.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-slate-100">
                              <span className="text-[11px] font-bold text-slate-500 block mb-1">
                                Historial de Abonos ({apt.abonos.length}):
                              </span>
                              <div className="space-y-1 max-h-20 overflow-y-auto pr-1 text-[11px]">
                                {apt.abonos.map((abn) => (
                                  <div key={abn.id} className="flex justify-between items-center text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">
                                    <span>{new Date(abn.date).toLocaleDateString('es-MX')} - {abn.note || 'Abono'}</span>
                                    <span className="font-bold text-emerald-700">+{currency}{abn.amount.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Abono Button */}
                            {apt.saldoPendiente > 0 && apt.status !== 'cancelado' && (
                              <button
                                onClick={() => onOpenAbonoModal(apt)}
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-1"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Abonar</span>
                              </button>
                            )}

                            {/* Mark as Delivered */}
                            {isLiquidado && apt.status !== 'entregado' && (
                              <button
                                onClick={() => onUpdateApartadoStatus(apt.id, 'entregado')}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Entregar</span>
                              </button>
                            )}

                            {/* WhatsApp Reminder */}
                            <button
                              onClick={() => handleSendWhatsAppReminder(apt)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                              title="Enviar recordatorio de saldo por WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>

                            {/* Nota de Remisión */}
                            <button
                              onClick={() => setRemisionApartado(apt)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                              title="Ver nota de remisión del mes"
                            >
                              <Receipt className="w-3.5 h-3.5 text-slate-600" />
                              <span className="hidden sm:inline">Nota</span>
                            </button>
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: 'Eliminar Apartado',
                                message: `¿Estás segura de eliminar el apartado de ${apt.clientName}?`,
                                onConfirm: () => {
                                  onDeleteApartado(apt.id);
                                  setConfirmModal(null);
                                },
                              });
                            }}
                            className="p-2 text-rose-600 bg-rose-50 border border-rose-200 hover:text-rose-700 hover:bg-rose-100 rounded-xl transition shrink-0"
                            title="Eliminar apartado"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ===================== TAB 2: VENTAS POR DÍA & GANANCIAS (REPORTE EXCEL) ===================== */}
          {activeTab === 'sales_report' && (
            <div className="space-y-6">
              
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                
                {/* Total Venta Registrada */}
                <div className="bg-white p-4 rounded-3xl border border-teal-100 shadow-xs">
                  <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                    Venta Total Registrada
                  </span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    {currency}{totalVentasRegistradas.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Total vendido en apartados y productos
                  </span>
                </div>

                {/* Inversión / Costo Total */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Inversión / Costo de Mercancía
                  </span>
                  <span className="text-2xl font-black text-slate-700 mt-1 block">
                    {currency}{totalInversionVentasRealizadas.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Costo de compra de los artículos
                  </span>
                </div>

                {/* Ganancia Neta Total */}
                <div className="bg-gradient-to-br from-teal-50 to-rose-50 p-4 rounded-3xl border border-rose-200 shadow-xs">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                    Ganancia Neta Obtenida
                  </span>
                  <span className="text-2xl font-black text-rose-600 mt-1 block">
                    {currency}{totalGananciaVentasRealizadas.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-rose-800/80 font-bold mt-0.5 block">
                    {totalVentasRegistradas > 0 ? `${Math.round((totalGananciaVentasRealizadas / totalVentasRegistradas) * 100)}% margen global` : '0%'}
                  </span>
                </div>

                {/* Descargar Excel Card Action */}
                <div className="bg-emerald-500 text-white p-4 rounded-3xl shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider block">
                      Exportar Reporte
                    </span>
                    <h4 className="text-base font-black mt-0.5">
                      Descargar Archivo Excel
                    </h4>
                  </div>
                  <button
                    onClick={handleExportExcel}
                    className="mt-3 w-full py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-extrabold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar .xlsx</span>
                  </button>
                </div>

              </div>

              {/* Daily Sales Breakdown Table */}
              <div className="bg-white rounded-3xl border border-teal-100 overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5 border-b border-teal-100 bg-teal-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Desglose de Ventas y Ganancias por Día
                    </h3>
                    <p className="text-xs text-slate-500">
                      Calcula artículos vendidos por día, costo de inversión, total vendido y ganancia
                    </p>
                  </div>
                  <button
                    onClick={handleExportExcel}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Exportar esta tabla a Excel</span>
                  </button>
                </div>

                {dailySalesReport.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 text-xs">
                    No hay ventas registradas todavía. Los apartados y ventas aparecerán aquí automáticamente agrupados por fecha.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        <tr>
                          <th className="py-3 px-4">Fecha</th>
                          <th className="py-3 px-3 text-center">Artículos Vendidos</th>
                          <th className="py-3 px-3">Inversión (Costo)</th>
                          <th className="py-3 px-3">Venta Total</th>
                          <th className="py-3 px-3">Recaudado (Abonos)</th>
                          <th className="py-3 px-4 text-right">Ganancia Neta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dailySalesReport.map((day) => {
                          const marginPercent = day.totalVenta > 0 
                            ? Math.round((day.gananciaEstimada / day.totalVenta) * 100) 
                            : 0;

                          return (
                            <tr key={day.date} className="hover:bg-teal-50/20 transition">
                              <td className="py-3 px-4 font-bold text-slate-900">
                                {day.date}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 font-extrabold text-xs">
                                  {day.itemsCount} piezas
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-600 font-semibold">
                                {currency}{day.totalInversion.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-900">
                                {currency}{day.totalVenta.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-emerald-700 font-semibold">
                                {currency}{day.totalRecaudado.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-extrabold text-rose-600 block text-sm">
                                  +{currency}{day.gananciaEstimada.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  ({marginPercent}% margen)
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ===================== TAB 3: INVENTARIO & UBICACIÓN EN PESTAÑAS ===================== */}
          {activeTab === 'inventory' && (
            <div className="space-y-5">
              
              {/* Financial Inventory Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Inversión en Stock */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Inversión Total en Stock
                  </span>
                  <span className="text-xl font-black text-slate-800 mt-0.5 block">
                    {currency}{totalInversionInventario.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Costo acumulado de las existencias actuales
                  </span>
                </div>

                {/* Valor de Venta en Stock */}
                <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-2xs">
                  <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                    Valor de Venta en Stock
                  </span>
                  <span className="text-xl font-black text-teal-800 mt-0.5 block">
                    {currency}{totalValorVentaInventario.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-teal-600">
                    Monto total si se vende todo el inventario
                  </span>
                </div>

                {/* Ganancia Potencial */}
                <div className="bg-gradient-to-br from-teal-50 to-rose-50 p-4 rounded-2xl border border-rose-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                    Ganancia Proyectada del Stock
                  </span>
                  <span className="text-xl font-black text-rose-600 mt-0.5 block">
                    {currency}{totalGananciaPotencialInventario.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-rose-800 font-bold">
                    Margen bruto si se comercializa todo
                  </span>
                </div>

              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-teal-100 shadow-2xs">
                
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-teal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar producto por nombre..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                {/* Category select filter */}
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="Todas">Todas las categorías</option>
                  {config.categories.filter(c => c !== 'Todas' && c !== 'Todos').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  {/* Export Excel Button */}
                  <button
                    onClick={handleExportExcel}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    title="Exportar inventario y costos a Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Excel</span>
                  </button>

                  {/* Add New Product Button */}
                  <button
                    id="admin-add-product-btn"
                    onClick={onOpenNewProductModal}
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    + Nuevo Producto
                  </button>
                </div>

              </div>

              {/* Products Table with Quick Category Relocation Dropdown */}
              <div className="bg-white rounded-3xl border border-teal-100 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-teal-50/70 border-b border-teal-100 text-teal-950 font-bold">
                      <tr>
                        <th className="py-3 px-4">Producto</th>
                        <th className="py-3 px-3">Pestaña / Categoría</th>
                        <th className="py-3 px-3">Costo (Inversión)</th>
                        <th className="py-3 px-3">Precio Venta</th>
                        <th className="py-3 px-3">Ganancia / Margen</th>
                        <th className="py-3 px-3">Stock</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((p) => {
                        const img = p.designs?.[0]?.imageUrl || '';
                        const cost = p.costPrice ?? null;
                        const profit = cost !== null ? (p.price - cost) : null;
                        const profitPercent = (profit !== null && p.price > 0) ? Math.round((profit / p.price) * 100) : null;

                        return (
                          <tr key={p.id} className="hover:bg-teal-50/30 transition">
                            {/* Product & Photo */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {img && (
                                  <img
                                    src={img}
                                    alt={p.name}
                                    className="w-11 h-11 rounded-xl object-cover border border-slate-100 shadow-2xs shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate max-w-xs">{p.name}</div>
                                  <div className="text-[11px] text-teal-700 font-semibold">
                                    {p.designs?.length || 1} diseño(s) &bull; {p.colors?.length || 0} color(es)
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Quick Category Relocation Dropdown */}
                            <td className="py-3 px-3">
                              <select
                                value={p.category}
                                onChange={(e) => handleQuickCategoryChange(p.id, e.target.value)}
                                className="px-2 py-1 bg-teal-50/80 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
                                title="Cambiar a otra pestaña/categoría"
                              >
                                {config.categories.filter(c => c !== 'Todas' && c !== 'Todos').map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </td>

                            {/* Cost Price */}
                            <td className="py-3 px-3">
                              <span className="text-slate-600 font-semibold">
                                {cost !== null ? `${currency}${cost.toFixed(2)}` : <span className="text-slate-400 italic">N/A</span>}
                              </span>
                            </td>

                            {/* Selling Price */}
                            <td className="py-3 px-3">
                              <div className="font-black text-slate-900">
                                {currency}{p.price.toFixed(2)}
                              </div>
                            </td>

                            {/* Profit */}
                            <td className="py-3 px-3">
                              {profit !== null ? (
                                <div>
                                  <span className={`font-extrabold ${profit >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                                    +{currency}{profit.toFixed(2)}
                                  </span>
                                  {profitPercent !== null && (
                                    <span className="text-[10px] font-bold text-slate-400 block">
                                      {profitPercent}%
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>

                            {/* Stock with quick buttons */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => onQuickStockChange(p.id, -1)}
                                  className="w-6 h-6 rounded-md bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                                  title="Restar 1"
                                >
                                  -
                                </button>
                                <span className={`font-bold w-6 text-center ${
                                  p.stock <= 0 ? 'text-rose-600 font-black' : p.stock <= 3 ? 'text-amber-600' : 'text-slate-800'
                                }`}>
                                  {p.stock}
                                </span>
                                <button
                                  onClick={() => onQuickStockChange(p.id, 1)}
                                  className="w-6 h-6 rounded-md bg-slate-100 hover:bg-teal-100 hover:text-teal-800 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                                  title="Sumar 1"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => onOpenEditProductModal(p)}
                                  className="p-1.5 hover:bg-teal-100 text-teal-800 rounded-lg transition"
                                  title="Editar producto completo (fotos, precios, costos)"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: 'Eliminar Producto',
                                      message: `¿Estás segura de eliminar "${p.name}" del catálogo?`,
                                      onConfirm: () => {
                                        onDeleteProduct(p.id);
                                        setConfirmModal(null);
                                      },
                                    });
                                  }}
                                  className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                                  title="Eliminar producto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ===================== TAB 4: AJUSTES DE TIENDA ===================== */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              
              <div className="bg-white p-6 rounded-3xl border border-teal-100 shadow-xs">
                <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-teal-600" />
                  Información y Datos de la Tienda
                </h3>

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Nombre de la Tienda
                    </label>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Eslogan / Subtítulo
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Banner de Anuncios Superior
                    </label>
                    <input
                      type="text"
                      value={announcementBanner}
                      onChange={(e) => setAnnouncementBanner(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Número de WhatsApp para Pedidos y Contacto
                    </label>
                    <input
                      type="text"
                      required
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Paleta de Colores de la Tienda (Kawaii Theme)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setThemePreference('tiffany-rose')}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                          themePreference === 'tiffany-rose'
                            ? 'bg-gradient-to-r from-teal-50 to-pink-50 border-pink-400 ring-2 ring-pink-200'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">🎀</span>
                          <span className="text-[10px] font-extrabold bg-gradient-to-r from-teal-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
                            RECOMENDADA
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-bold text-slate-900">Dúo Tiffany & Rosa</div>
                          <div className="text-[10px] text-slate-500">Equilibrio perfecto dulce y tierno</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setThemePreference('rosa')}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                          themePreference === 'rosa'
                            ? 'bg-pink-50 border-pink-400 ring-2 ring-pink-200'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">🌸</span>
                          <span className="text-[10px] font-extrabold bg-pink-500 text-white px-2 py-0.5 rounded-full">
                            KAWAII
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-bold text-slate-900">Rosa Pastel Bonita</div>
                          <div className="text-[10px] text-slate-500">Tierno estilo fresa & blush</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setThemePreference('tiffany')}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                          themePreference === 'tiffany'
                            ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-200'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">💎</span>
                          <span className="text-[10px] font-extrabold bg-teal-600 text-white px-2 py-0.5 rounded-full">
                            TIFFANY
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-bold text-slate-900">Tiffany Menta</div>
                          <div className="text-[10px] text-slate-500">Fresco y elegante agua marina</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      PIN de Acceso Administradora (Seguridad Privada)
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        required
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        placeholder="••••"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={showPin ? "Ocultar PIN" : "Ver PIN"}
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Solo los administradores autorizados deben conocer este PIN.
                    </span>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSavingConfig}
                      className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-xl font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSavingConfig ? 'Guardando...' : 'Guardar Ajustes'}
                    </button>
                  </div>

                  {configSavedSuccess && (
                    <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs font-bold text-center animate-fadeIn">
                      ✨ ¡Configuración actualizada correctamente!
                    </div>
                  )}
                </form>
              </div>

              {/* Manage Categories */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-slate-800 mb-1">Pestañas / Categorías</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Estas son las pestañas que ven tus clientas en la tienda. Puedes eliminar las que no uses (solo si ningún producto la tiene asignada).
                </p>
                <div className="flex flex-wrap gap-2">
                  {config.categories.filter(c => c !== 'Todas' && c !== 'Todos').map(cat => (
                    <span
                      key={cat}
                      className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => setConfirmModal({
                          isOpen: true,
                          title: 'Eliminar Categoría',
                          message: `¿Seguro que quieres eliminar la pestaña "${cat}"? Esto solo funciona si ningún producto la está usando.`,
                          onConfirm: () => {
                            onDeleteCategory(cat);
                            setConfirmModal(null);
                          },
                        })}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        title={`Eliminar categoría ${cat}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Reset to initial data */}
              <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-200">
                <h4 className="text-sm font-bold text-rose-900 mb-1">
                  Zona de Restauración
                </h4>
                <p className="text-xs text-rose-700 mb-4">
                  Restaura los productos iniciales y catálogo oficial si deseas reiniciar las pruebas.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Restaurar Datos Iniciales',
                      message: '¿Estás segura de restaurar los productos iniciales del catálogo?',
                      onConfirm: () => {
                        onResetToDefaults();
                        setConfirmModal(null);
                      },
                    });
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Catálogo Inicial</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Nota de Remisión Modal */}
      {remisionApartado && (() => {
        const { folio, relacionados } = getRemisionGroup(remisionApartado);
        const monthLabel = new Date(remisionApartado.createdAt).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
        const totalGeneral = relacionados.reduce((sum, a) => sum + a.totalPrice, 0);
        const totalAbonadoGeneral = relacionados.reduce((sum, a) => sum + a.totalAbonado, 0);
        const saldoGeneral = relacionados.reduce((sum, a) => sum + a.saldoPendiente, 0);

        return (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] shadow-2xl border border-teal-100 relative flex flex-col overflow-hidden">
              <button
                onClick={() => setRemisionApartado(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto flex-1">
                <div ref={remisionRef} className="p-6 sm:p-8" style={{ backgroundColor: '#ffffff' }}>
                {/* Header */}
                <div className="text-center mb-5 pb-4" style={{ borderBottom: '2px dashed #99f6e4' }}>
                  <h2
                    style={{ fontFamily: "'Mrs Saint Delafield', cursive", color: '#115e59' }}
                    className="text-4xl sm:text-5xl mb-0.5 leading-none"
                  >
                    {config.storeName}
                  </h2>
                  <p className="text-[11px] uppercase tracking-[0.2em] font-bold mt-1" style={{ color: '#64748b' }}>
                    Nota de Remisión
                  </p>
                </div>

                {/* Folio & Mes */}
                <div className="flex justify-between items-center text-xs mb-4 rounded-xl px-3.5 py-2.5" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span className="font-semibold" style={{ color: '#64748b' }}>Folio: </span>
                    <span className="font-black" style={{ color: '#0f172a' }}>#{String(folio).padStart(4, '0')}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold" style={{ color: '#64748b' }}>Corte: </span>
                    <span className="font-black capitalize" style={{ color: '#0f172a' }}>{monthLabel}</span>
                  </div>
                </div>

                {/* Cliente */}
                <div className="mb-4">
                  <div className="font-bold text-base" style={{ color: '#0f172a' }}>{remisionApartado.clientName}</div>
                  {remisionApartado.clientPhone && (
                    <div className="text-xs" style={{ color: '#64748b' }}>{remisionApartado.clientPhone}</div>
                  )}
                </div>

                {/* Pedidos del mes */}
                <div className="space-y-3 mb-4">
                  {relacionados.map((apt) => {
                    const items = apt.items && apt.items.length > 0 ? apt.items : [{
                      id: `legacy-${apt.id}`,
                      productName: apt.productName,
                      quantity: apt.quantity,
                      subtotal: apt.totalPrice,
                    }];
                    return (
                      <div key={apt.id} className="pb-2.5" style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <div className="text-[10px] font-bold mb-1" style={{ color: '#94a3b8' }}>
                          {new Date(apt.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                        </div>
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between text-xs py-0.5" style={{ color: '#334155' }}>
                            <span>{item.productName} <span style={{ color: '#94a3b8' }}>x{item.quantity}</span></span>
                            <span className="font-semibold">{currency}{Number(item.subtotal ?? 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* Totales */}
                <div className="pt-3 space-y-1.5" style={{ borderTop: '2px dashed #99f6e4' }}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold" style={{ color: '#475569' }}>Total del mes:</span>
                    <span className="font-bold" style={{ color: '#0f172a' }}>{currency}{totalGeneral.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold" style={{ color: '#0f766e' }}>Abonado:</span>
                    <span className="font-bold" style={{ color: '#0f766e' }}>{currency}{totalAbonadoGeneral.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <span className="font-bold text-sm" style={{ color: '#be123c' }}>Saldo pendiente:</span>
                    <span className="font-black text-lg" style={{ color: '#e11d48' }}>{currency}{saldoGeneral.toFixed(2)}</span>
                  </div>
                </div>
                </div>
              </div>

              {/* Download as Image Button (fijo abajo, fuera del \u00e1rea con scroll) */}
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-white shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadRemisionImage}
                  disabled={isDownloadingRemision}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isDownloadingRemision ? 'Generando imagen...' : 'Descargar como Imagen'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-teal-100 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              {confirmModal.title}
            </h3>
            <p className="text-xs text-slate-600 mb-5">
              {confirmModal.message}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
