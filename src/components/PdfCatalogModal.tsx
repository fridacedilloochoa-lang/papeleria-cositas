import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Sparkles, 
  Phone, 
  FileText, 
  DollarSign, 
  Layers, 
  Tag, 
  CheckCircle2,
  Filter,
  Eye
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Product, StoreConfig } from '../types';

interface PdfCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  config: StoreConfig;
  currency: string;
  isAdmin?: boolean;
}

export const PdfCatalogModal: React.FC<PdfCatalogModalProps> = ({
  isOpen,
  onClose,
  products,
  config,
  currency,
  isAdmin = false,
}) => {
  const [catalogType, setCatalogType] = useState<'client' | 'admin'>('client');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Seguridad: si el modo admin queda seleccionado pero la sesión de
  // administradora se cierra (o el modal se abre sin permisos), forzamos
  // el catálogo de vuelta al modo cliente para que nadie sin acceso pueda
  // ver costos ni ganancias.
  React.useEffect(() => {
    if (!isAdmin && catalogType === 'admin') {
      setCatalogType('client');
    }
  }, [isAdmin, catalogType]);

  if (!isOpen) return null;

  const filteredProducts = selectedCategory === 'Todas'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const handlePrint = () => {
    // Si por alguna razón el estado quedó en "admin" sin permisos, lo
    // regresamos a "client" antes de imprimir para no exponer costos.
    if (!isAdmin && catalogType === 'admin') {
      setCatalogType('client');
      return;
    }
    window.print();
  };

  const handleDownloadDirectPdf = async () => {
    // Bloqueo extra de seguridad: nunca generar el PDF con costos/ganancia
    // si quien lo pide no es administradora, sin importar el estado interno.
    const effectiveType: 'client' | 'admin' = isAdmin ? catalogType : 'client';
    try {
      setIsGeneratingPdf(true);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 18;

      // Header Colors: Tiffany (#0ABAB5) and Rose (#F472B6)
      doc.setFillColor(10, 186, 181); // Tiffany Blue
      doc.rect(0, 0, pageWidth, 12, 'F');

      doc.setFillColor(244, 114, 182); // Rose Accent Line
      doc.rect(0, 12, pageWidth, 2, 'F');

      // Title
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(config.storeName || 'Papelería La Señora Cositas', 14, y + 4);

      // Subtitle
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const subtitle = effectiveType === 'admin' 
        ? 'Reporte de Inventario, Costos y Precios de Venta'
        : (config.tagline || 'Catálogo Oficial de Productos y Novedades');
      doc.text(subtitle, 14, y + 9);

      // Contact & Date
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`WhatsApp / Pedidos: ${config.whatsappNumber}`, pageWidth - 14, y + 4, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, pageWidth - 14, y + 9, { align: 'right' });

      y += 18;

      // Category banner
      doc.setFillColor(240, 253, 250); // Light teal tint
      doc.roundedRect(14, y, pageWidth - 28, 8, 2, 2, 'F');
      doc.setTextColor(13, 148, 136);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(
        `Categoría: ${selectedCategory} (${filteredProducts.length} productos) • Modo: ${effectiveType === 'admin' ? 'Costos, Venta y Margen (Admin)' : 'Público / Clientes'}`,
        18,
        y + 5.5
      );

      y += 13;

      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 7, 'F');
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);

      if (effectiveType === 'admin') {
        doc.text('PRODUCTO', 16, y + 4.5);
        doc.text('CATEGORÍA', 80, y + 4.5);
        doc.text('STOCK', 115, y + 4.5, { align: 'center' });
        doc.text('COSTO', 138, y + 4.5, { align: 'right' });
        doc.text('P. VENTA', 162, y + 4.5, { align: 'right' });
        doc.text('GANANCIA', pageWidth - 16, y + 4.5, { align: 'right' });
      } else {
        doc.text('PRODUCTO', 16, y + 4.5);
        doc.text('CATEGORÍA', 95, y + 4.5);
        doc.text('DISEÑOS', 135, y + 4.5);
        doc.text('EXISTENCIAS', 160, y + 4.5, { align: 'center' });
        doc.text('PRECIO', pageWidth - 16, y + 4.5, { align: 'right' });
      }

      y += 9;

      // Rows
      filteredProducts.forEach((p, idx) => {
        // Check page overflow
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
          // Re-draw table header on new page
          doc.setFillColor(241, 245, 249);
          doc.rect(14, y, pageWidth - 28, 7, 'F');
          doc.setTextColor(51, 65, 85);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          if (effectiveType === 'admin') {
            doc.text('PRODUCTO', 16, y + 4.5);
            doc.text('CATEGORÍA', 80, y + 4.5);
            doc.text('STOCK', 115, y + 4.5, { align: 'center' });
            doc.text('COSTO', 138, y + 4.5, { align: 'right' });
            doc.text('P. VENTA', 162, y + 4.5, { align: 'right' });
            doc.text('GANANCIA', pageWidth - 16, y + 4.5, { align: 'right' });
          } else {
            doc.text('PRODUCTO', 16, y + 4.5);
            doc.text('CATEGORÍA', 95, y + 4.5);
            doc.text('DISEÑOS', 135, y + 4.5);
            doc.text('EXISTENCIAS', 160, y + 4.5, { align: 'center' });
            doc.text('PRECIO', pageWidth - 16, y + 4.5, { align: 'right' });
          }
          y += 9;
        }

        // Row background alternating
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y - 3, pageWidth - 28, 7, 'F');
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);

        // Product Name (truncated if too long)
        const nameFormatted = p.name.length > 38 ? p.name.substring(0, 36) + '...' : p.name;
        doc.text(nameFormatted, 16, y + 1.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);

        if (effectiveType === 'admin') {
          doc.text(p.category, 80, y + 1.5);
          doc.text(`${p.stock} pzas`, 115, y + 1.5, { align: 'center' });
          
          const cost = p.costPrice !== undefined ? `${currency}${p.costPrice.toFixed(2)}` : 'N/A';
          doc.text(cost, 138, y + 1.5, { align: 'right' });

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(13, 148, 136);
          doc.text(`${currency}${p.price.toFixed(2)}`, 162, y + 1.5, { align: 'right' });

          const profit = p.costPrice !== undefined ? (p.price - p.costPrice) : null;
          if (profit !== null) {
            doc.setTextColor(profit >= 0 ? 13 : 225, profit >= 0 ? 148 : 29, profit >= 0 ? 136 : 72);
            doc.text(`${currency}${profit.toFixed(2)}`, pageWidth - 16, y + 1.5, { align: 'right' });
          } else {
            doc.setTextColor(148, 163, 184);
            doc.text('-', pageWidth - 16, y + 1.5, { align: 'right' });
          }
        } else {
          doc.text(p.category, 95, y + 1.5);
          doc.text(`${p.designs?.length || 1} diseño(s)`, 135, y + 1.5);
          doc.text(p.stock > 0 ? `${p.stock} disponibles` : 'Agotado', 160, y + 1.5, { align: 'center' });

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(13, 148, 136);
          doc.text(`${currency}${p.price.toFixed(2)}`, pageWidth - 16, y + 1.5, { align: 'right' });
        }

        y += 7;
      });

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `${config.storeName} • Apartados vía WhatsApp: ${config.whatsappNumber} • Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
      }

      const fileName = effectiveType === 'admin'
        ? `Reporte-Costos-Inventario-${new Date().toISOString().slice(0, 10)}.pdf`
        : `Catalogo-Productos-${config.storeName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;

      doc.save(fileName);
    } catch (err) {
      console.error('Error generating direct PDF:', err);
      // Fallback to window.print()
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-fadeIn">
      <div 
        id="pdf-catalog-modal"
        className="relative bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-teal-100 flex flex-col max-h-[92vh]"
      >
        {/* Modal Toolbar (hidden on print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Generador y Descarga de Catálogo PDF
              </h3>
              <p className="text-xs text-teal-800 font-medium">
                Genera tu PDF con todas las fotos, precios, existencias y costos listo para descargar o imprimir
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Catalog Mode Selector */}
            <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setCatalogType('client')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  catalogType === 'client'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Catálogo Clientes
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setCatalogType('admin')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    catalogType === 'admin'
                      ? 'bg-pink-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Costos & Ganancia (Admin)
                </button>
              )}
            </div>

            {/* Direct Download PDF Button */}
            <button
              onClick={handleDownloadDirectPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generando...' : 'Descargar PDF (Tabla)'}</span>
            </button>

            {/* Print / Save dialog */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Abre la ventana de impresión para Guardar como PDF con fotos a color"
            >
              <Printer className="w-4 h-4" />
              <span>Guardar como PDF / Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar (no-print) */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4 no-print text-xs">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="font-bold text-slate-700 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-teal-600" /> Filtrar Categoría:
            </span>
            {config.categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-slate-500 font-medium shrink-0">
            {filteredProducts.length} productos listados
          </span>
        </div>

        {/* Printable Document Preview */}
        <div className="overflow-y-auto p-6 sm:p-10 flex-1 bg-white text-slate-900">
          
          {/* Printable Header */}
          <div className="border-b-2 border-teal-600 pb-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-500 flex items-center justify-center text-white font-black text-base shadow-xs">
                  🎀
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  {config.storeName}
                </h1>
              </div>
              <p className="text-sm text-teal-800 font-medium mt-1">
                {catalogType === 'admin' 
                  ? '📊 Reporte Interno de Inventario, Costo de Inversión y Precios de Venta'
                  : (config.tagline || 'Catálogo de Artículos de Papelería Bonita y Novedades')}
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900 flex items-center sm:justify-end gap-1">
                <Phone className="w-3.5 h-3.5 text-teal-600" /> WhatsApp: {config.whatsappNumber}
              </p>
              <p>Fecha de emisión: {new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}</p>
              <p className="text-pink-600 font-semibold">✨ Sistema de apartados disponible con anticipo</p>
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const mainImg = product.designs?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80';
              const cost = product.costPrice ?? null;
              const profit = cost !== null ? (product.price - cost) : null;
              const profitPercent = (profit !== null && product.price > 0) 
                ? Math.round((profit / product.price) * 100) 
                : null;

              return (
                <div 
                  key={product.id}
                  className="page-break-inside-avoid border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between bg-white shadow-2xs hover:shadow-xs transition"
                >
                  <div>
                    {/* Main Photo */}
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 mb-2.5 border border-slate-200 relative">
                      <img
                        src={mainImg}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white font-bold text-xs uppercase">
                          Agotado
                        </div>
                      )}
                    </div>

                    {/* ALL Design Images Gallery in PDF */}
                    {product.designs && product.designs.length > 1 && (
                      <div className="mb-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-teal-600" /> Todos los modelos ({product.designs.length}):
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {product.designs.map((des, dIdx) => (
                            <div key={des.id || dIdx} className="flex flex-col items-center">
                              <div className="w-full aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white">
                                <img
                                  src={des.imageUrl}
                                  alt={des.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80';
                                  }}
                                />
                              </div>
                              <span className="text-[8px] text-slate-600 font-semibold truncate w-full text-center mt-0.5" title={des.name}>
                                {des.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <span className="text-[10px] uppercase font-bold text-teal-800 px-2 py-0.5 rounded-md bg-teal-50 inline-block border border-teal-100">
                      {product.category}
                    </span>

                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 mt-1">
                      {product.name}
                    </h3>

                    {/* Colors */}
                    {product.colors && product.colors.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {product.colors.slice(0, 5).map(c => (
                          <span
                            key={c.id}
                            className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs"
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Financial & Stock Details */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                    {catalogType === 'admin' ? (
                      <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] space-y-1.5 border border-slate-200">
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Costo / Inversión:</span>
                          <span className="font-bold text-slate-800">
                            {cost !== null ? `${currency}${cost.toFixed(2)}` : 'No asignado'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-teal-900">
                          <span className="font-bold">Precio de Venta:</span>
                          <span className="font-black text-teal-700">
                            {currency}{product.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-pink-900 pt-1 border-t border-slate-200">
                          <span className="font-bold">Ganancia Unitaria:</span>
                          <span className="font-black text-pink-600">
                            {profit !== null ? `${currency}${profit.toFixed(2)} (${profitPercent}%)` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500 pt-0.5 text-[10px]">
                          <span>Existencias:</span>
                          <span className="font-bold">{product.stock} piezas</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-base font-black text-slate-900">
                            {currency}{product.price.toFixed(2)}
                          </span>
                          {product.comparePrice && product.comparePrice > product.price && (
                            <span className="text-xs text-slate-400 line-through ml-1.5">
                              {currency}{product.comparePrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          product.stock > 0 ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Printable Footer */}
          <div className="mt-10 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
            <p className="font-bold text-slate-700">
              {config.storeName} &bull; Pedidos y Apartados al WhatsApp: {config.whatsappNumber}
            </p>
            <p className="mt-1">
              Precios y existencias sujetos a disponibilidad al momento de apartar.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
