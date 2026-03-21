'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useProducts } from '@/context/ProductsContext'
import { createOrder, type CreateOrderPayload } from '@/api/orders'
import type { Order } from '@/api/orders'
import type { Product } from '@/types'
import styles from './StaffSales.module.css'

const MEMBERSHIP_OPTIONS: Order['membership_level'][] = ['none', 'silver', 'gold', 'platinum']

const today = () => new Date().toISOString().slice(0, 10)

const emptyItem = () => ({
    name: '',
    sku_color: '',
    size: '',
    quantity: 1,
    price: 0,
})

export default function StaffSales() {
    const { token } = useAuth()
    const router = useRouter()
    const { products, loading: productsLoading } = useProducts()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showValidation, setShowValidation] = useState(false)
    const [customer_id, setCustomerId] = useState('')
    const [customer_name, setCustomerName] = useState('')
    const [mobile, setMobile] = useState('')
    const [address, setAddress] = useState('')
    const [membership_level, setMembershipLevel] = useState<Order['membership_level']>('none')
    const [order_date, setOrderDate] = useState(today())
    const [delivery_due_date, setDeliveryDueDate] = useState('')
    const [items, setItems] = useState([emptyItem()])
    const [pickerOpen, setPickerOpen] = useState(false)
    const [pickerRowIndex, setPickerRowIndex] = useState(0)
    const [pickerSearch, setPickerSearch] = useState('')
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
    const [selectedSize, setSelectedSize] = useState<string | null>(null)

    function addItem() {
        setItems((prev) => [...prev, emptyItem()])
    }

    function removeItem(index: number) {
        setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
    }

    function updateItem<K extends keyof (ReturnType<typeof emptyItem>)>(
        index: number,
        field: K,
        value: (ReturnType<typeof emptyItem>)[K]
    ) {
        setItems((prev) =>
            prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
        )
    }

    const openPicker = (rowIndex: number) => {
        setPickerRowIndex(rowIndex)
        setSelectedProduct(null)
        setSelectedVariantIndex(0)
        setSelectedSize(null)
        setPickerSearch('')
        setPickerOpen(true)
    }

    const filteredProducts = useMemo(() => {
        const q = pickerSearch.trim().toLowerCase()
        if (!q) return products
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.sku && p.sku.toLowerCase().includes(q))
        )
    }, [products, pickerSearch])

    const variant = selectedProduct?.variants?.[selectedVariantIndex]
    const sizes = variant?.sizes?.length ? variant.sizes : (selectedProduct?.sizes ?? [])
    const pickerPrice = variant
        ? (variant.discountedPrice ?? variant.price)
        : selectedProduct
            ? (selectedProduct.salePrice ?? selectedProduct.price)
            : 0
    const pickerSkuColor = variant?.skuColor ?? selectedProduct?.sku ?? ''
    const pickerSize = selectedSize ?? sizes[0] ?? ''

    function addSelectionToRow() {
        if (!selectedProduct) return
        const size = selectedSize ?? sizes[0] ?? ''
        updateItem(pickerRowIndex, 'name', selectedProduct.name)
        updateItem(pickerRowIndex, 'sku_color', pickerSkuColor)
        updateItem(pickerRowIndex, 'size', size)
        updateItem(pickerRowIndex, 'price', pickerPrice)
        updateItem(pickerRowIndex, 'quantity', 1)
        setPickerOpen(false)
        setSelectedProduct(null)
    }

    const invalidCustomerName = showValidation && !customer_name.trim()
    const invalidMobile = showValidation && !mobile.trim()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!token) return
        setError(null)
        setShowValidation(true)
        const trimmedName = customer_name.trim()
        const trimmedMobile = mobile.trim()
        if (!trimmedName || !trimmedMobile) {
            setError('Customer name and mobile are required.')
            return
        }
        const validItems = items
            .map((row) => ({
                name: String(row.name).trim(),
                sku_color: String(row.sku_color).trim() || undefined,
                size: String(row.size).trim() || undefined,
                quantity: Math.max(1, Number(row.quantity) || 1),
                price: Number(row.price) || 0,
            }))
            .filter((row) => row.name.length > 0)
        if (validItems.length === 0) {
            setError('Add at least one item with a product name.')
            return
        }
        const trimmedId = customer_id.trim()
        const idNum = trimmedId === '' ? NaN : parseInt(trimmedId, 10)
        const payload: CreateOrderPayload = {
            ...(Number.isInteger(idNum) && idNum >= 1 ? { customer_id: idNum } : {}),
            customer_name: trimmedName,
            mobile: trimmedMobile,
            address: address.trim() || null,
            membership_level,
            order_date,
            delivery_due_date: delivery_due_date.trim() || null,
            items: validItems,
        }
        setLoading(true)
        try {
            const order = await createOrder(payload, token)
            router.replace(`/staff/orders/${order.id}`)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create order')
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className={styles.wrap}>
                <Link href="/staff/orders" className={styles.backLink}>
                    ← Orders
                </Link>
                <p className={styles.error}>Sign in required.</p>
            </div>
        )
    }

    return (
        <div className={styles.wrap}>
            <Link href="/staff/orders" className={styles.backLink}>
                ← Orders
            </Link>
            <h1 className={styles.title}>Sales</h1>
            <p className={styles.subtitle}>
                Add a new purchase manually. It will appear as <strong>New</strong> in Delivery and Order Tracking.
            </p>

            <form onSubmit={handleSubmit}>
                {error && <p className={styles.error}>{error}</p>}

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Customer</h2>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor="customer_id">
                            Customer ID
                        </label>
                        <input
                            id="customer_id"
                            className={styles.input}
                            type="number"
                            min={1}
                            step={1}
                            value={customer_id}
                            onChange={(e) => setCustomerId(e.target.value)}
                            placeholder="Optional — leave empty to create new customer"
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor="customer_name">
                            Customer name *
                        </label>
                        <input
                            id="customer_name"
                            className={`${styles.input} ${invalidCustomerName ? styles.inputInvalid : ''}`}
                            type="text"
                            value={customer_name}
                            onChange={(e) => setCustomerName(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor="mobile">
                            Mobile *
                        </label>
                        <input
                            id="mobile"
                            className={`${styles.input} ${invalidMobile ? styles.inputInvalid : ''}`}
                            type="text"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor="address">
                            Address
                        </label>
                        <input
                            id="address"
                            className={styles.input}
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor="membership_level">
                            Membership
                        </label>
                        <select
                            id="membership_level"
                            className={styles.select}
                            value={membership_level}
                            onChange={(e) => setMembershipLevel(e.target.value as Order['membership_level'])}
                        >
                            {MEMBERSHIP_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Dates</h2>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor="order_date">
                                Order date *
                            </label>
                            <input
                                id="order_date"
                                className={styles.input}
                                type="date"
                                value={order_date}
                                onChange={(e) => setOrderDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor="delivery_due_date">
                                Delivery due
                            </label>
                            <input
                                id="delivery_due_date"
                                className={styles.input}
                                type="date"
                                value={delivery_due_date}
                                onChange={(e) => setDeliveryDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Items</h2>
                    <div className={styles.field}>
                        <table className={styles.itemTable}>
                            <thead>
                            <tr>
                                <th className={styles.colName}>Product name *</th>
                                <th className={styles.colSku}>SKU-Color</th>
                                <th className={styles.colSize}>Size</th>
                                <th className={styles.colQty}>Qty</th>
                                <th className={styles.colPrice}>Price</th>
                                <th className={styles.colRemove} />
                            </tr>
                            </thead>
                            <tbody>
                            {items.map((row, i) => (
                                <tr key={i}>
                                    <td className={styles.colName}>
                                        <input
                                            type="text"
                                            value={row.name}
                                            onChange={(e) => updateItem(i, 'name', e.target.value)}
                                            placeholder="Product name"
                                        />
                                        <button
                                            type="button"
                                            className={styles.pickFromCatalog}
                                            onClick={() => openPicker(i)}
                                        >
                                            Pick from catalog
                                        </button>
                                    </td>
                                    <td className={styles.colSku}>
                                        <input
                                            type="text"
                                            value={row.sku_color}
                                            onChange={(e) => updateItem(i, 'sku_color', e.target.value)}
                                            placeholder="e.g. VORT-TWHT"
                                        />
                                    </td>
                                    <td className={styles.colSize}>
                                        <input
                                            type="text"
                                            value={row.size}
                                            onChange={(e) => updateItem(i, 'size', e.target.value)}
                                            placeholder="S, M, L"
                                        />
                                    </td>
                                    <td className={styles.colQty}>
                                        <input
                                            type="number"
                                            min={1}
                                            value={row.quantity}
                                            onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value, 10) || 1)}
                                        />
                                    </td>
                                    <td className={styles.colPrice}>
                                        <input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={row.price || ''}
                                            onChange={(e) => updateItem(i, 'price', parseFloat(e.target.value) || 0)}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className={styles.colRemove}>
                                        <button
                                            type="button"
                                            className={styles.btnSecondary}
                                            onClick={() => removeItem(i)}
                                            aria-label="Remove row"
                                        >
                                            −
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <div className={styles.btnRow}>
                            <button type="button" className={styles.btnSecondary} onClick={addItem}>
                                + Add line
                            </button>
                        </div>
                    </div>
                </section>

                <div className={styles.btnRow}>
                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Creating…' : 'Create order'}
                    </button>
                    <Link href="/staff/orders" className={styles.btnSecondary} style={{ padding: '10px 18px' }}>
                        Cancel
                    </Link>
                </div>
            </form>

            {pickerOpen && (
                <div
                    className={styles.modalBackdrop}
                    onClick={() => setPickerOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="picker-title"
                >
                    <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 id="picker-title" className={styles.modalTitle}>
                                Select product from catalog
                            </h2>
                            <button type="button" className={styles.modalClose} onClick={() => setPickerOpen(false)}>
                                Close
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {!selectedProduct ? (
                                <>
                                    <input
                                        type="search"
                                        className={styles.pickerSearch}
                                        placeholder="Search by name or SKU…"
                                        value={pickerSearch}
                                        onChange={(e) => setPickerSearch(e.target.value)}
                                        autoFocus
                                    />
                                    {productsLoading ? (
                                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Loading catalog…</p>
                                    ) : (
                                        <ul className={styles.productList}>
                                            {filteredProducts.map((p) => (
                                                <li
                                                    key={p.id}
                                                    className={styles.productListItem}
                                                    onClick={() => {
                                                        setSelectedProduct(p)
                                                        setSelectedVariantIndex(0)
                                                        setSelectedSize(p.variants?.[0]?.sizes?.[0] ?? p.sizes?.[0] ?? null)
                                                    }}
                                                >
                                                    <img src={p.image} alt="" className={styles.productListThumb} />
                                                    <div className={styles.productListInfo}>
                                                        <p className={styles.productListName}>{p.name}</p>
                                                        <p className={styles.productListMeta}>
                                                            {p.sku} · {(p.salePrice ?? p.price).toFixed(2)} ₼
                                                        </p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {!productsLoading && filteredProducts.length === 0 && (
                                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                            No products match. Try another search.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className={styles.variantStep}>
                                    <p className={styles.productListName} style={{ marginBottom: 12 }}>
                                        {selectedProduct.name}
                                    </p>
                                    {selectedProduct.variants && selectedProduct.variants.length > 1 && (
                                        <>
                                            <p className={styles.variantStepTitle}>Color / variant</p>
                                            <div className={styles.variantGrid}>
                                                {selectedProduct.variants.map((v, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        className={`${styles.variantBtn} ${selectedVariantIndex === idx ? styles.variantBtnActive : ''}`}
                                                        onClick={() => {
                                                            setSelectedVariantIndex(idx)
                                                            setSelectedSize(v.sizes?.[0] ?? null)
                                                        }}
                                                    >
                                                        {v.color} · {(v.discountedPrice ?? v.price).toFixed(2)} ₼
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    {sizes.length > 1 && (
                                        <>
                                            <p className={styles.variantStepTitle}>Size</p>
                                            <div className={styles.sizeGrid}>
                                                {sizes.map((s) => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        className={`${styles.variantBtn} ${selectedSize === s ? styles.variantBtnActive : ''}`}
                                                        onClick={() => setSelectedSize(s)}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    <p className={styles.variantStepTitle} style={{ marginBottom: 4 }}>
                                        Add to line: {selectedProduct.name}
                                        {variant ? ` · ${variant.color}` : ''}
                                        {pickerSize ? ` · ${pickerSize}` : ''} · {pickerPrice.toFixed(2)} ₼
                                    </p>
                                    <button type="button" className={styles.addToRowBtn} onClick={addSelectionToRow}>
                                        Add to row
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
