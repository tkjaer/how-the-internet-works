import { definePlace } from '$core/define';
import onTheGo from '../on-the-go/place';

// On the go around 2010: a smartphone on 3G (HSPA). The NodeB on the mast sends the radio pieces back to its
// radio network controller (RNC), which ends the radio layers and, with Direct Tunnel (3GPP Rel-7, common by 2010),
// tunnels the packets (GTP-U) straight to the GGSN, the mobile network's gate to the internet. The SGSN signs the
// phone in and sets the tunnel up, beside the path.
export default definePlace({
  variantOf: 'on-the-go',
  order: 2.4,
  era: '2010',
  hops: [
    { at: 'phone', node: 'phone-3g', addr: '10.152.33.7' },
    { link: 'hspa', km: 0.8 },
    { at: 'cell-tower', node: 'nodeb' },
    // Iub: the radio pieces go on, unopened, to the RNC (in 2010 often over E1 lines or microwave, #108)
    { link: 'metro-fibre', stack: ['hspa'], km: 15 },
    { at: 'rnc', in: 'internet', addr: '10.30.4.9', owner: 'isp' },
    // RNCs stood in regional sites, the few GGSNs in the operator's central ones: the tunnel crosses the country
    { link: 'backbone', stack: ['ethernet', 'gtp'], km: 120 },
    // the GGSN: the tunnel's far end, and NAT (most phones had a private address)
    { at: 'mobile-core', in: 'internet', addr: '10.30.0.1', natTo: '192.0.2.61:31044', owner: 'isp' },
    { link: 'metro-fibre', stack: ['ethernet', 'mpls'], km: 5 },
  ],
  aside: [{ at: 'sgsn', in: 'internet', from: 'rnc', link: 'metro-fibre', owner: 'isp' }],
  layout: {
    // the same street, so the trip in time only swaps the phone and the mast
    overview: onTheGo.layout!.overview,
    internet: {
      landscape: { nodes: { 'cell-tower': [90, 740, 120], rnc: [340, 450, 140, 'above'], sgsn: [540, 690, 110, 'above'], 'mobile-core': [750, 370, 160] }, owners: { isp: [400, 210] } },
      portrait: {
        nodes: { 'cell-tower': [170, 1480, 120], rnc: [720, 1470, 140], sgsn: [260, 1240, 110], 'mobile-core': [720, 1110, 160] },
        links: { 'mobile-core-core': { bend: 0.15 } },
        owners: { isp: [330, 1080] },
      },
    },
  },
});
