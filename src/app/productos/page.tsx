'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  talla?: string;
  cantidad: number;
  imagen_url?: string;
}

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) =>
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              📦 Gestión de Productos
            </h1>
            <div className="flex gap-4">
              <Link
                href="/"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                🏠 Inicio
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                📊 Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar productos por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <svg
              className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {searchTerm
              ? `Resultados: ${filteredProducts.length} de ${products.length} productos`
              : `Total: ${products.length} productos`}
          </h2>
          <button
            onClick={loadProducts}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
          </div>
        ) : (
          <>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-cyan-500 transition-all"
                  >
                    {product.imagen_url && (
                      <div className="w-full h-48 bg-slate-700 rounded-lg mb-4 overflow-hidden">
                        <img
                          src={product.imagen_url}
                          alt={product.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <h3 className="text-lg font-bold text-white mb-2">
                      {product.nombre}
                    </h3>

                    {product.descripcion && (
                      <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                        {product.descripcion}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Precio:</span>
                        <span className="text-cyan-400 font-bold text-lg">
                          ${product.precio.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Stock:</span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            product.cantidad === 0
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : product.cantidad < 5
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                              : 'bg-green-500/20 text-green-400 border border-green-500/40'
                          }`}
                        >
                          {product.cantidad} uds
                        </span>
                      </div>

                      {product.talla && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">Talla:</span>
                          <span className="text-white font-medium">{product.talla}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-700">
                        <span className="text-slate-500 text-xs">ID: {product.id}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                {products.length === 0 ? (
                  <div className="space-y-6">
                    <div className="text-6xl">📦</div>
                    <div className="space-y-2">
                      <p className="text-slate-300 text-2xl font-bold">
                        No hay productos disponibles
                      </p>
                      <p className="text-slate-400 text-lg">
                        Aún no has agregado ningún producto a tu catálogo
                      </p>
                    </div>
                    <button
                      className="mt-6 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                      onClick={() => window.location.href = '/'}
                    >
                      ➕ Agregar primer producto
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-6xl">🔍</div>
                    <div className="space-y-2">
                      <p className="text-slate-300 text-2xl font-bold">
                        No hay ningún producto con este nombre
                      </p>
                      <p className="text-slate-400 text-lg">
                        No se encontraron resultados para "{searchTerm}"
                      </p>
                    </div>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-6 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                    >
                      🔄 Ver todos los productos
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
