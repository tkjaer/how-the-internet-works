<svelte:options namespace="svg" />
<script lang="ts">
  import type { DeviceProps } from '../../../core/theme-types';
  let { id, x, y, size, time, focused }: DeviceProps = $props();
  const wiggle = $derived(focused ? Math.sin(time * 3) * 1.2 : 0);
</script>

<g class="dev dev-{id}" class:focused transform="translate({x - size / 2} {y - size / 2}) scale({size / 200}) rotate({wiggle} 100 100)">
  {#if focused}<path class="focus-paper" d="M18 38 C42 8 158 8 184 48 C198 90 178 166 132 187 C82 200 21 169 11 116 C6 83 4 61 18 38 Z" />{/if}
  {#if id === 'phone'}
    <path class="shadow" d="M59 14 L141 17 L139 185 L57 181 Z" />
    <path class="body coral" d="M56 13 L143 16 L139 187 L58 183 Z" />
    <path class="face cream" d="M68 34 L132 36 L130 154 L69 151 Z" />
    <path class="mark blue" d="M91 74 L92 108 L118 91 Z" />
    <circle class="detail" cx="100" cy="171" r="6" />
  {:else if id === 'ap'}
    <path class="line-shadow" d="M62 124 L48 51 M138 124 L152 51" />
    <path class="line" d="M62 124 L48 51 M138 124 L152 51" />
    <circle class="dot" cx="48" cy="48" r="12" /><circle class="dot" cx="152" cy="48" r="12" />
    <path class="shadow" d="M29 117 L174 120 L169 169 L31 166 Z" />
    <path class="body teal" d="M27 116 L174 120 L168 169 L32 166 Z" />
    <path class="paper-stroke" d="M80 101 Q101 78 121 101 M67 88 Q100 55 133 88" />
  {:else if id === 'router' || id === 'home'}
    <path class="line-shadow" d="M58 88 L43 34 M142 88 L157 34" />
    <path class="line" d="M58 88 L43 34 M142 88 L157 34" />
    <path class="shadow" d="M21 81 L181 85 L176 153 L20 150 Z" />
    <path class="body mustard" d="M18 80 L182 84 L176 154 L22 150 Z" />
    <circle class="led" cx="50" cy="117" r="7" /><circle class="led" cx="73" cy="117" r="7" /><circle class="led" cx="96" cy="117" r="7" />
    {#if id === 'home'}<path class="roof" d="M42 82 L100 38 L158 84 Z" />{/if}
  {:else if id === 'internet'}
    <path class="internet-shadow" d="M32 151 C17 139 19 108 42 98 C45 70 72 56 96 70 C112 42 153 43 168 76 C190 81 203 101 199 125 C194 148 174 157 151 153 L36 153 Z" />
    <path class="internet-cloud" d="M29 148 C14 136 17 107 39 96 C43 70 71 55 95 69 C112 42 151 42 167 75 C189 80 201 101 197 124 C192 145 173 153 150 150 L35 150 Z" />
    <circle class="globe-cut" cx="103" cy="111" r="27" />
    <ellipse class="globe-line" cx="103" cy="111" rx="10" ry="27" />
    <path class="globe-line" d="M77 111 H129 M84 96 H122 M84 126 H122" />
    <path class="town-cut" d="M54 140 V122 L66 113 L78 122 V140 M83 140 V116 H99 V140 M106 140 V127 H119 V140 M124 140 V119 L136 110 L149 120 V140 Z" />
  {:else if id === 'cabinet'}
    <path class="shadow" d="M50 29 L151 32 L148 181 L51 177 Z" />
    <path class="body sage" d="M48 28 L152 32 L148 182 L52 178 Z" />
    <path class="fold" d="M100 40 L99 170" /><circle class="dot" cx="89" cy="105" r="6" /><circle class="dot" cx="111" cy="105" r="6" />
  {:else if id === 'backhaul'}
    <path class="shadow" d="M22 69 L181 72 L178 132 L20 129 Z" />
    <path class="body blue" d="M19 68 L182 72 L178 133 L21 129 Z" />
    {#each [0,1,2,3,4,5] as i}<rect class="slot" x={34 + i * 23} y="90" width="16" height="13" rx="2" />{/each}
    <circle class="led" cx="41" cy="117" r="5" /><circle class="led" cx="57" cy="117" r="5" />
  {:else if id === 'bng'}
    <path class="shadow" d="M30 39 L171 42 L168 162 L31 158 Z" />
    <path class="body deep" d="M28 38 L172 42 L168 163 L32 158 Z" />
    <path class="face cream" d="M60 70 L140 72 L137 132 L61 129 Z" />
    <path class="mark coral" d="M100 77 L123 88 V104 C122 117 112 123 100 127 C88 123 78 117 77 104 V88 Z" />
  {:else if id === 'core'}
    <circle class="shadow" cx="103" cy="105" r="71" />
    <circle class="body teal" cx="100" cy="100" r="70" />
    <path class="paper-stroke" d="M60 100 H140 M100 60 V140 M72 72 L128 128 M128 72 L72 128" />
    <circle class="mark mustard" cx="100" cy="100" r="16" />
  {:else if id === 'transit'}
    <circle class="shadow" cx="103" cy="105" r="67" />
    <circle class="body deep" cx="100" cy="100" r="66" />
    <ellipse class="paper-stroke" cx="100" cy="100" rx="29" ry="65" />
    <path class="paper-stroke" d="M34 100 H166 M44 66 H156 M44 134 H156" />
  {:else if id === 'ixp'}
    <path class="shadow" d="M25 56 L177 59 L174 146 L23 143 Z" />
    <path class="body coral" d="M23 55 L177 59 L174 145 L24 143 Z" />
    {#each [0,1,2,3] as i}<circle class="dot cream" cx={52 + i * 32} cy="100" r="10" />{/each}
    <path class="paper-stroke" d="M52 100 Q84 70 116 100 T148 100" />
  {:else if id === 'cdn'}
    {#each [0,1,2] as i}
      <path class="shadow" d={`M40 ${40 + i*42} L160 ${42 + i*42} L157 ${76 + i*42} L41 ${74 + i*42} Z`} />
      <path class="body sage" d={`M38 ${39 + i*42} L161 ${42 + i*42} L157 ${76 + i*42} L42 ${74 + i*42} Z`} />
      <circle class="led" cx="62" cy={57 + i * 42} r="5" />
    {/each}
    <path class="mark mustard" d="M119 50 L119 67 L135 58 Z" />
  {/if}
</g>

<style>
  .focus-paper { fill: var(--focus-paper); transform: translate(14px, 17px); opacity: .78; }
  .shadow { fill: var(--paper-shadow); transform: translate(8px, 9px); opacity: .36; }
  .body { stroke: var(--device-edge); stroke-width: 5; stroke-linejoin: round; }
  .teal { fill: var(--paper-teal); } .mustard { fill: var(--paper-mustard); } .coral { fill: var(--paper-coral); } .deep { fill: var(--paper-deep); } .sage { fill: var(--paper-sage); } .blue { fill: var(--paper-blue); } .cream { fill: var(--paper-cream); }
  .face { stroke: var(--device-edge); stroke-width: 3; stroke-linejoin: round; }
  .mark, .dot, .detail, .led { fill: var(--paper-cream); stroke: var(--device-edge); stroke-width: 2.5; }
  .line-shadow { fill: none; stroke: var(--paper-shadow); stroke-width: 9; stroke-linecap: round; transform: translate(6px, 7px); opacity: .35; }
  .line { fill: none; stroke: var(--device-edge); stroke-width: 7; stroke-linecap: round; }
  .paper-stroke { fill: none; stroke: var(--paper-cream); stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }
  .paper-stroke.thin { stroke-width: 5; }
  .fold { stroke: var(--device-edge); stroke-width: 4; stroke-linecap: round; opacity: .55; }
  .slot { fill: var(--paper-cream); opacity: .88; }
  .roof { fill: var(--paper-coral); stroke: var(--device-edge); stroke-width: 4; stroke-linejoin: round; }
  .focused .shadow { transform: translate(13px, 16px); opacity: .45; }
  .internet-shadow { fill: var(--paper-shadow); transform: translate(9px, 11px); opacity: .42; }
  .internet-cloud { fill: var(--paper-cream); stroke: var(--device-edge); stroke-width: 5; stroke-linejoin: round; }
  .globe-cut, .town-cut { fill: var(--paper-blue); stroke: var(--device-edge); stroke-width: 2.5; stroke-linejoin: round; }
  .globe-line { fill: none; stroke: var(--paper-cream); stroke-width: 4; stroke-linecap: round; opacity: .9; }
</style>
