import React, { useEffect } from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { FeesRows, TotalAmountRow } from '../components/amounts-section';
import { Footer, Section } from '../components/shared';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MetadataSection, TokensSection } from '../components/sections';
import {
  QuantumTunnelBadge,
  injectQuantumTunnelStyles,
} from '../../../components/app/bnes/quantum-tunnel-badge';

export function SendDetails({
  item,
}: {
  item: Extract<ActivityListItem, { type: 'send' | 'receive' }>;
}) {
  // 確保量子隧道 CSS 動畫 Keyframes 已注入 <head>
  useEffect(() => {
    injectQuantumTunnelStyles();
  }, []);

  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <TokensSection tokens={[{ token: item.data.token }]} />
        <MetadataSection
          item={item}
          addressRows={{ from: item.data.from, to: item.data.to }}
        />
        {/* BNES 量子隧道保護標籤：僅在 BNES 主網（0x9c8ce）時顯示 */}
        <QuantumTunnelBadge chainId={item.chainId} variant="banner" />
        <Section>
          <FeesRows item={item} />
          <TotalAmountRow token={item.data.token} />
        </Section>
      </div>
      <Footer>
        <BlockExplorerButton chainId={item.chainId} txHash={item.hash} />
      </Footer>
    </div>
  );
}

