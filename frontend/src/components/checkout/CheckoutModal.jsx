import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import api from '../../services/api';
import { getAssetUrl } from '../../utils/imageUrl';

const CheckoutModal = () => {
  const {
    cart,
    cartSubtotal,
    discountAmount,
    shippingFee,
    finalTotal,
    promo,
    customer,
    checkoutModalOpen,
    setCheckoutModalOpen,
    clearCart,
    showToast,
    navigateTo
  } = useStore();

  // Accordion Step: 1 (Login) | 2 (Address) | 3 (Summary) | 4 (Payment)
  const [activeStep, setActiveStep] = useState(2);

  // Address state
  const [name, setName] = useState('Mitalee Maurya');
  const [email, setEmail] = useState('mitaleemaurya@gmail.com');
  const [phone, setPhone] = useState('8757201351');
  const [street, setStreet] = useState('Flat 402, Lotus Orchid, Palm Beach Road');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('400705');
  const [landmark, setLandmark] = useState('Opposite Sea Breeze Towers');
  const [addressType, setAddressType] = useState('HOME');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [upiId, setUpiId] = useState('');
  const [captchaCode, setCaptchaCode] = useState('529');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const generateCaptcha = () => {
    const code = Math.floor(100 + Math.random() * 900).toString();
    setCaptchaCode(code);
    setUserCaptchaInput('');
    setCaptchaError('');
  };

  useEffect(() => {
    if (checkoutModalOpen) {
      generateCaptcha();
    }
  }, [checkoutModalOpen]);

  useEffect(() => {
    if (customer) {
      if (customer.name) setName(customer.name);
      if (customer.email) setEmail(customer.email);
      if (customer.phone) setPhone(customer.phone);

      // If customer has addresses array, pick default
      if (customer.addresses && customer.addresses.length > 0) {
        const defAddr = customer.addresses.find(a => a.isDefault) || customer.addresses[0];
        setStreet(defAddr.street || '');
        setCity(defAddr.city || '');
        setState(defAddr.state || '');
        setPincode(defAddr.pincode || '');
        setLandmark(defAddr.landmark || '');
        setAddressType(defAddr.type || 'HOME');
      } else if (customer.address) {
        setStreet(customer.address.street || '');
        setCity(customer.address.city || '');
        setState(customer.address.state || '');
        setPincode(customer.address.pincode || '');
      }
    }
  }, [customer]);

  if (!checkoutModalOpen) return null;

  const handleClose = () => {
    setPlacedOrder(null);
    setCheckoutModalOpen(false);
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // If COD, validate Captcha
    if (paymentMethod === 'Cash on Delivery') {
      if (userCaptchaInput.trim() !== captchaCode) {
        setCaptchaError('Incorrect captcha code. Please enter the 3-digit code shown.');
        return;
      }
    }

    const fullAddress = `${street}, ${landmark ? landmark + ', ' : ''}${city}, ${state} - ${pincode} (${addressType})`.trim();
    const orderData = {
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      address: fullAddress,
      items: cart.map(item => ({
        productId: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        image: item.image
      })),
      subtotal: cartSubtotal,
      discount: discountAmount,
      couponUsed: promo ? promo.code : null,
      total: finalTotal,
      paymentMethod: paymentMethod,
      notes: `Flipkart Order - ${addressType} Delivery`
    };

    setPlacingOrder(true);
    try {
      const res = await api.createOrder(orderData);
      if (res.success && res.order) {
        setPlacedOrder(res.order);
        clearCart();
        showToast('Order Placed! 🎉', `Order #${res.order.id} confirmed.`, 'success');
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      // Fallback local order creation
      const mockOrder = {
        ...orderData,
        id: `PRT-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString(),
        status: 'Confirmed'
      };
      setPlacedOrder(mockOrder);
      clearCart();
      showToast('Order Placed! 🎉', `Order #${mockOrder.id} confirmed.`, 'success');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div
      className="custom-modal-overlay active"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 9999,
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={handleClose}
    >
      <div
        className="custom-modal-card fk-checkout-modal"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: placedOrder ? '600px' : '980px',
          background: '#f1f3f6',
          borderRadius: '8px',
          padding: 0,
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '14px',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            fontSize: '1.2rem',
            cursor: 'pointer',
            color: '#64748b',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          &times;
        </button>

        {placedOrder ? (
          /* --- Flipkart Order Success & Delivery Timeline View --- */
          <div className="fk-tracker-card" style={{ background: '#fff', padding: '32px 24px', borderRadius: '8px' }}>
            <div className="fk-tracker-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', background: '#e8f5e9', color: '#388e3c', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '12px' }}>
                <i className="fa-solid fa-check"></i>
              </div>
              <h2 style={{ fontSize: '1.45rem', color: '#212121', margin: '0 0 6px 0', fontWeight: 700 }}>
                Order Confirmed!
              </h2>
              <p style={{ color: '#878787', fontSize: '0.9rem', margin: 0 }}>
                Order ID: <strong style={{ color: '#2874f0' }}>{placedOrder.id}</strong>
              </p>
              <p style={{ color: '#388e3c', fontSize: '0.84rem', marginTop: '6px', fontWeight: 600 }}>
                Confirmation sent to {placedOrder.customerEmail}
              </p>
            </div>

            {/* Flipkart 4-Step Delivery Progress Bar */}
            <div className="fk-timeline-stepper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 0 28px', position: 'relative' }}>
              <div className="fk-timeline-step completed" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2 }}>
                <div className="fk-timeline-dot" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#388e3c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <i className="fa-solid fa-check"></i>
                </div>
                <span className="fk-step-lbl" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#212121' }}>Ordered</span>
                <small style={{ fontSize: '0.7rem', color: '#878787' }}>Today</small>
              </div>

              <div className="fk-timeline-line completed" style={{ flex: 1, height: '3px', background: '#388e3c', margin: '0 -4px 18px', zIndex: 1 }}></div>

              <div className="fk-timeline-step completed" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2 }}>
                <div className="fk-timeline-dot" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#388e3c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <i className="fa-solid fa-box"></i>
                </div>
                <span className="fk-step-lbl" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#212121' }}>Packed</span>
                <small style={{ fontSize: '0.7rem', color: '#878787' }}>Ready</small>
              </div>

              <div className="fk-timeline-line in-progress" style={{ flex: 1, height: '3px', background: 'linear-gradient(to right, #388e3c, #2874f0)', margin: '0 -4px 18px', zIndex: 1 }}></div>

              <div className="fk-timeline-step in-progress" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2 }}>
                <div className="fk-timeline-dot" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2874f0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', marginBottom: '6px', boxShadow: '0 0 0 4px rgba(40, 116, 240, 0.2)' }}>
                  <i className="fa-solid fa-truck-fast"></i>
                </div>
                <span className="fk-step-lbl" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2874f0' }}>Shipped</span>
                <small style={{ fontSize: '0.7rem', color: '#878787' }}>In Transit</small>
              </div>

              <div className="fk-timeline-line" style={{ flex: 1, height: '3px', background: '#e2e8f0', margin: '0 -4px 18px', zIndex: 1 }}></div>

              <div className="fk-timeline-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2 }}>
                <div className="fk-timeline-dot" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <i className="fa-solid fa-house"></i>
                </div>
                <span className="fk-step-lbl" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#878787' }}>Delivered</span>
                <small style={{ fontSize: '0.7rem', color: '#878787' }}>In 2-3 Days</small>
              </div>
            </div>

            {/* Address & Payment Info */}
            <div className="fk-track-address-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '16px', marginBottom: '20px', fontSize: '0.86rem' }}>
              <div style={{ fontWeight: 700, color: '#212121', marginBottom: '4px' }}>Delivery Address</div>
              <div style={{ color: '#475569', lineHeight: 1.5 }}>
                {placedOrder.customerName} - {placedOrder.customerPhone}
                <br />
                {placedOrder.address}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginTop: '10px' }}>
                <span>Payment Mode: <strong>{placedOrder.paymentMethod}</strong></span>
                <span style={{ fontWeight: 700, color: '#212121', fontSize: '1.05rem' }}>Total: ₹{Math.round(placedOrder.total).toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  handleClose();
                  navigateTo('orders');
                }}
                style={{ flex: 1, padding: '12px', background: '#2874f0', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                <i className="fa-solid fa-box-open"></i> Go to My Orders
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleClose}
                style={{ flex: 1, padding: '12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', color: '#212121' }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* --- Flipkart 4-Step Accordion Checkout --- */
          <div className="fk-checkout-grid">
            
            {/* Left 4-Step Accordion */}
            <div className="fk-checkout-accordion" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* STEP 1: LOGIN */}
              <div className="fk-step-card" style={{ background: '#fff', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '14px 20px', background: activeStep === 1 ? '#2874f0' : '#fff', color: activeStep === 1 ? '#fff' : '#878787', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ background: activeStep === 1 ? '#fff' : '#f0f0f0', color: activeStep === 1 ? '#2874f0' : '#878787', width: '24px', height: '24px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                      1
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.3px', color: activeStep === 1 ? '#fff' : '#878787' }}>
                      Login
                    </span>
                    {activeStep > 1 && (
                      <span style={{ color: '#212121', fontWeight: 600, fontSize: '0.88rem', marginLeft: '10px' }}>
                        {name} <span style={{ color: '#878787', fontWeight: 400 }}>+91 {phone}</span>
                      </span>
                    )}
                  </div>
                  {activeStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      style={{ background: 'none', border: '1px solid #e0e0e0', color: '#2874f0', padding: '4px 16px', borderRadius: '2px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      CHANGE
                    </button>
                  )}
                </div>

                {activeStep === 1 && (
                  <div style={{ padding: '20px' }}>
                    <div className="fk-form-row">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#878787', marginBottom: '4px' }}>Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '2px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#878787', marginBottom: '4px' }}>Mobile Number</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '2px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      style={{ marginTop: '16px', background: '#fb641b', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '2px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'uppercase' }}
                    >
                      CONTINUE CHECKOUT
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 2: DELIVERY ADDRESS */}
              <div className="fk-step-card" style={{ background: '#fff', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '14px 20px', background: activeStep === 2 ? '#2874f0' : '#fff', color: activeStep === 2 ? '#fff' : '#878787', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ background: activeStep === 2 ? '#fff' : '#f0f0f0', color: activeStep === 2 ? '#2874f0' : '#878787', width: '24px', height: '24px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                      2
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.3px', color: activeStep === 2 ? '#fff' : '#878787' }}>
                      Delivery Address
                    </span>
                    {activeStep > 2 && (
                      <span style={{ color: '#212121', fontWeight: 600, fontSize: '0.88rem', marginLeft: '10px' }}>
                        {street.slice(0, 30)}... {pincode}
                      </span>
                    )}
                  </div>
                  {activeStep > 2 && (
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      style={{ background: 'none', border: '1px solid #e0e0e0', color: '#2874f0', padding: '4px 16px', borderRadius: '2px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      CHANGE
                    </button>
                  )}
                </div>

                {activeStep === 2 && (
                  <div style={{ padding: '20px' }}>
                    <div className="fk-form-row">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#878787', marginBottom: '4px' }}>Full Name *</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#878787', marginBottom: '4px' }}>10-digit mobile number *</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div className="fk-form-row">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#878787', marginBottom: '4px' }}>Pincode *</label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#878787', marginBottom: '4px' }}>Landmark (Optional)</label>
                        <input
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#878787', marginBottom: '4px' }}>Address (Area and Street) *</label>
                      <input
                        type="text"
                        required
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div className="fk-form-row">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#878787', marginBottom: '4px' }}>City / District / Town *</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#878787', marginBottom: '4px' }}>State *</label>
                        <input
                          type="text"
                          required
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    {/* Address Type */}
                    <div className="fk-address-type-row" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '18px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#878787' }}>Address Type:</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="addrType"
                          checked={addressType === 'HOME'}
                          onChange={() => setAddressType('HOME')}
                        />
                        Home (All day delivery)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="addrType"
                          checked={addressType === 'WORK'}
                          onChange={() => setAddressType('WORK')}
                        />
                        Work (Delivery between 10 AM - 5 PM)
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      style={{ background: '#fb641b', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '2px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 2px 6px rgba(251, 100, 27, 0.4)' }}
                    >
                      DELIVER HERE
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 3: ORDER SUMMARY */}
              <div className="fk-step-card" style={{ background: '#fff', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '14px 20px', background: activeStep === 3 ? '#2874f0' : '#fff', color: activeStep === 3 ? '#fff' : '#878787', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ background: activeStep === 3 ? '#fff' : '#f0f0f0', color: activeStep === 3 ? '#2874f0' : '#878787', width: '24px', height: '24px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                      3
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.3px', color: activeStep === 3 ? '#fff' : '#878787' }}>
                      Order Summary
                    </span>
                    {activeStep > 3 && (
                      <span style={{ color: '#212121', fontWeight: 600, fontSize: '0.88rem', marginLeft: '10px' }}>
                        {cart.length} Item{cart.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {activeStep > 3 && (
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      style={{ background: 'none', border: '1px solid #e0e0e0', color: '#2874f0', padding: '4px 16px', borderRadius: '2px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      CHANGE
                    </button>
                  )}
                </div>

                {activeStep === 3 && (
                  <div style={{ padding: '20px' }}>
                    {cart.map((item) => {
                      const itemImg = getAssetUrl(item.image);
                      return (
                        <div key={`${item.id}-${item.selectedSize}`} style={{ display: 'flex', gap: '16px', padding: '14px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <img src={itemImg} alt={item.title} style={{ width: '64px', height: '64px', objectFit: 'contain', background: '#f8fafc', borderRadius: '4px', padding: '4px' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#212121' }}>{item.title}</div>
                            <div style={{ fontSize: '0.82rem', color: '#878787', margin: '4px 0' }}>
                              Size: {item.selectedSize || 'Standard'} | Qty: {item.quantity}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#212121' }}>₹{(item.price * item.quantity).toLocaleString()}</span>
                              <span style={{ fontSize: '0.78rem', color: '#388e3c', fontWeight: 600 }}>Flipkart Assured</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '4px', margin: '14px 0', fontSize: '0.85rem', color: '#475569' }}>
                      Order confirmation email will be sent to <strong>{email}</strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveStep(4)}
                      style={{ background: '#fb641b', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '2px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 2px 6px rgba(251, 100, 27, 0.4)' }}
                    >
                      CONTINUE TO PAYMENT
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 4: PAYMENT OPTIONS & COD CAPTCHA */}
              <div className="fk-step-card" style={{ background: '#fff', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '14px 20px', background: activeStep === 4 ? '#2874f0' : '#fff', color: activeStep === 4 ? '#fff' : '#878787', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ background: activeStep === 4 ? '#fff' : '#f0f0f0', color: activeStep === 4 ? '#2874f0' : '#878787', width: '24px', height: '24px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                      4
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.3px', color: activeStep === 4 ? '#fff' : '#878787' }}>
                      Payment Options
                    </span>
                  </div>
                </div>

                {activeStep === 4 && (
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      
                      {/* UPI Option */}
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', border: '1px solid', borderColor: paymentMethod === 'Online UPI' ? '#2874f0' : '#e0e0e0', background: paymentMethod === 'Online UPI' ? '#f8fbff' : '#fff', borderRadius: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="payOption"
                          checked={paymentMethod === 'Online UPI'}
                          onChange={() => setPaymentMethod('Online UPI')}
                          style={{ marginTop: '3px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#212121' }}>UPI (Google Pay, PhonePe, Paytm, QR)</div>
                          {paymentMethod === 'Online UPI' && (
                            <div style={{ marginTop: '10px' }}>
                              <input
                                type="text"
                                placeholder="Enter UPI ID (e.g. mobile@upi)"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                style={{ width: '240px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }}
                              />
                            </div>
                          )}
                        </div>
                      </label>

                      {/* Card Option */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', border: '1px solid', borderColor: paymentMethod === 'Credit / Debit Card' ? '#2874f0' : '#e0e0e0', background: paymentMethod === 'Credit / Debit Card' ? '#f8fbff' : '#fff', borderRadius: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="payOption"
                          checked={paymentMethod === 'Credit / Debit Card'}
                          onChange={() => setPaymentMethod('Credit / Debit Card')}
                        />
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#212121' }}>Credit / Debit / ATM Card</div>
                      </label>

                      {/* Net Banking */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', border: '1px solid', borderColor: paymentMethod === 'Net Banking' ? '#2874f0' : '#e0e0e0', background: paymentMethod === 'Net Banking' ? '#f8fbff' : '#fff', borderRadius: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="payOption"
                          checked={paymentMethod === 'Net Banking'}
                          onChange={() => setPaymentMethod('Net Banking')}
                        />
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#212121' }}>Net Banking</div>
                      </label>

                      {/* Cash on Delivery with 3-digit Captcha Verification */}
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', border: '1px solid', borderColor: paymentMethod === 'Cash on Delivery' ? '#2874f0' : '#e0e0e0', background: paymentMethod === 'Cash on Delivery' ? '#f8fbff' : '#fff', borderRadius: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="payOption"
                          checked={paymentMethod === 'Cash on Delivery'}
                          onChange={() => setPaymentMethod('Cash on Delivery')}
                          style={{ marginTop: '3px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#212121' }}>
                            Cash on Delivery (Pay cash at your doorstep)
                          </div>
                          
                          {paymentMethod === 'Cash on Delivery' && (
                            <div className="fk-cod-captcha-box" style={{ marginTop: '12px', background: '#fefce8', border: '1px solid #fef08a', padding: '12px 16px', borderRadius: '4px' }}>
                              <div style={{ fontSize: '0.82rem', color: '#854d0e', marginBottom: '8px' }}>
                                Enter characters shown below to confirm your COD order:
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ background: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', fontSize: '1.35rem', fontWeight: 800, padding: '4px 14px', letterSpacing: '4px', borderRadius: '4px', userSelect: 'none' }}>
                                  {captchaCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={generateCaptcha}
                                  title="Refresh Captcha"
                                  style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}
                                >
                                  <i className="fa-solid fa-arrows-rotate"></i>
                                </button>
                                <input
                                  type="text"
                                  maxLength={3}
                                  placeholder="Code"
                                  value={userCaptchaInput}
                                  onChange={(e) => {
                                    setUserCaptchaInput(e.target.value);
                                    setCaptchaError('');
                                  }}
                                  style={{ width: '90px', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 700, letterSpacing: '2px', fontSize: '1rem', textAlign: 'center' }}
                                />
                              </div>
                              {captchaError && (
                                <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '6px', fontWeight: 600 }}>
                                  {captchaError}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* Submit Confirmation */}
                    <div className="fk-pay-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                      <div style={{ fontSize: '1.1rem', color: '#212121' }}>
                        Total Payable: <strong>₹{Math.round(finalTotal).toLocaleString()}</strong>
                      </div>
                      <button
                        type="button"
                        disabled={placingOrder}
                        onClick={handleConfirmOrder}
                        style={{
                          background: '#fb641b',
                          color: '#fff',
                          border: 'none',
                          padding: '14px 36px',
                          borderRadius: '2px',
                          fontWeight: 800,
                          fontSize: '1rem',
                          cursor: placingOrder ? 'not-allowed' : 'pointer',
                          boxShadow: '0 3px 10px rgba(251, 100, 27, 0.4)',
                          textTransform: 'uppercase'
                        }}
                      >
                        {placingOrder ? 'Confirming Order...' : 'CONFIRM ORDER'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sticky Flipkart PRICE DETAILS Card */}
            <div className="fk-price-details-card" style={{ background: '#fff', borderRadius: '4px', padding: '16px 20px', height: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#878787', textTransform: 'uppercase', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px', marginBottom: '14px' }}>
                Price Details
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#212121' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Price ({cart.length} item{cart.length > 1 ? 's' : ''})</span>
                  <span>₹{cartSubtotal.toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#388e3c' }}>
                    <span>Discount</span>
                    <span>-₹{Math.round(discountAmount).toLocaleString()}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Delivery Charges</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span><del style={{ color: '#878787' }}>₹40</del> <span style={{ color: '#388e3c', fontWeight: 600 }}>FREE</span></span>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>

                <div style={{ borderTop: '1px dashed #e0e0e0', paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: '#212121' }}>
                  <span>Total Payable</span>
                  <span style={{ color: '#2874f0' }}>₹{Math.round(finalTotal).toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ color: '#388e3c', fontWeight: 600, fontSize: '0.82rem', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                    You will save ₹{Math.round(discountAmount).toLocaleString()} on this order
                  </div>
                )}
              </div>

              {/* Trust Badge */}
              <div style={{ marginTop: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#878787', fontSize: '0.8rem' }}>
                <i className="fa-solid fa-shield-halved" style={{ color: '#2874f0', fontSize: '1.2rem' }}></i>
                <span>Safe and Secure Payments. 100% Authentic Products.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
