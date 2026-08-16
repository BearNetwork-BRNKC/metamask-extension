/**
 * BNES 量子隧道保護標籤元件
 *
 * 功能：在 BNES 主網（chainId 0x9c8ce）的轉帳確認頁與交易詳情頁，
 * 顯示「🔒 量子隧道保護中」安全提示標籤，提升核心用戶的信任感。
 *
 * 設計原則：
 * - 僅在 chainId === BNES_PQC_CHAIN_ID 時渲染，其他網路完全不顯示
 * - 純展示元件，無副作用
 * - 使用 MetaMask 設計系統 Token（不引入外部 CSS 依賴）
 */

import React from 'react';
import { BNES_PQC_CHAIN_ID } from '../../../../shared/bnes-pqc/config';

/** 可傳入 eip155: 格式或純 hex 格式 */
function normalizeToBnesHex(chainId: string | undefined): string {
  if (!chainId) {
    return '';
  }
  // CAIP-2 格式：eip155:641230
  if (chainId.startsWith('eip155:')) {
    const decimal = chainId.split(':')[1];
    return '0x' + parseInt(decimal, 10).toString(16);
  }
  return chainId.toLowerCase();
}

interface QuantumTunnelBadgeProps {
  /** 目前交易所在的 chainId（支援 eip155: CAIP-2 格式或 hex 格式） */
  chainId: string | undefined;
  /** 顯示模式：'inline' 為行內小標籤（預設），'banner' 為橫幅卡片 */
  variant?: 'inline' | 'banner';
}

/**
 * 量子隧道安全標籤
 *
 * 若當前 chainId 為 BNES 主網，渲染安全提示；否則渲染 null。
 */
export function QuantumTunnelBadge({
  chainId,
  variant = 'inline',
}: QuantumTunnelBadgeProps) {
  const normalizedChainId = normalizeToBnesHex(chainId);

  // 僅在 BNES 主網時顯示
  if (normalizedChainId !== BNES_PQC_CHAIN_ID.toLowerCase()) {
    return null;
  }

  if (variant === 'banner') {
    return (
      <div
        className="bnes-quantum-tunnel-banner"
        data-testid="bnes-quantum-tunnel-banner"
        role="status"
        aria-label="BNES 量子隧道保護已啟用"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.12) 0%, rgba(0, 150, 255, 0.12) 100%)',
          border: '1px solid rgba(0, 212, 170, 0.35)',
          marginTop: '8px',
          marginBottom: '4px',
        }}
      >
        {/* 量子波紋動畫圓點 */}
        <span
          aria-hidden="true"
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#00d4aa',
            flexShrink: 0,
            animation: 'bnes-quantum-pulse 2s ease-in-out infinite',
            boxShadow: '0 0 0 0 rgba(0, 212, 170, 0.4)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#00d4aa',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            BearNetwork BNES
          </span>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-text-default, #d6d6d6)',
              fontWeight: 500,
            }}
          >
            🔒 量子隧道保護中（ML-DSA-87 雙簽章已啟用）
          </span>
        </div>
      </div>
    );
  }

  // 預設：inline 小標籤
  return (
    <span
      className="bnes-quantum-tunnel-badge"
      data-testid="bnes-quantum-tunnel-badge"
      role="status"
      aria-label="BNES 量子隧道保護中"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600,
        background: 'linear-gradient(90deg, rgba(0, 212, 170, 0.15), rgba(0, 150, 255, 0.15))',
        border: '1px solid rgba(0, 212, 170, 0.4)',
        color: '#00d4aa',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#00d4aa',
          animation: 'bnes-quantum-pulse 2s ease-in-out infinite',
        }}
      />
      🔒 量子隧道保護中
    </span>
  );
}

/**
 * 注入 CSS 動畫 Keyframes 至 <head>（僅執行一次）。
 * 在 React tree 掛載時呼叫，確保動畫可用。
 */
export function injectQuantumTunnelStyles(): void {
  const STYLE_ID = 'bnes-quantum-tunnel-styles';
  if (document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes bnes-quantum-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(0, 212, 170, 0.5); opacity: 1; }
      50%  { box-shadow: 0 0 0 6px rgba(0, 212, 170, 0); opacity: 0.7; }
      100% { box-shadow: 0 0 0 0 rgba(0, 212, 170, 0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}
