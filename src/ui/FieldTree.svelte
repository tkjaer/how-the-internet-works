<script lang="ts">
  // The detail view of the caught packet (issue #17): a protocol tree like Wireshark's, without the bytes. One row per
  // layer (a summary line from its values), unfolding into the header's shape, drawn 32 bits a row like the RFCs do,
  // and every field: its value here, its size and what it's for.
  import type { FieldView, HopView } from '../model/packet';
  import type { Route } from '../model/resolve';
  import { fill, loc, tr, trl, yours } from '../state.svelte';
  import { learnMore } from './caption';
  import Change from './Change.svelte';
  let { v, route }: { v: HopView; route: Route } = $props();
  const technical = (key: string) => trl(key, 'technical');
  const summary = (id: string, fields: FieldView[]) => fill(technical(`layer.${id}.line`), Object.fromEntries(fields.map((f) => [f.id, f.value.key ? trl(f.value.key) : f.value.text])));
  const vars = $derived({ yours: yours(route.chain[0]) });

  /** Header diagram: fields laid 32 bits a row, a field crossing a row end split in two. */
  function rows(fields: FieldView[]) {
    if (!fields.every((f) => f.bits)) return null;
    const out: { f: FieldView; col: number; span: number; first: boolean }[][] = [[]];
    let pos = 0;
    for (const f of fields) {
      let left = f.bits!;
      while (left > 0) {
        const col = pos % 32, span = Math.min(left, 32 - col);
        if (col === 0 && pos > 0) out.push([]);
        out[out.length - 1].push({ f, col, span, first: left === f.bits });
        pos += span;
        left -= span;
      }
    }
    return out;
  }
  // unfold the layers this hop acts on
  const acts = (l: HopView['layers'][number]) => l.state !== 'sealed' && l.fields.some((f) => f.used || f.before);
</script>

<div class="tree">
  {#each v.layers as l (l.id + l.change)}
    {@const sealed = l.state === 'sealed'}
    {@const grid = sealed ? null : rows(l.fields)}
    {@const links = learnMore(route.era, [`layer.${l.id}`], loc.lang, 'technical', 2)}
    <details class="tree-layer {l.state}" class:off={l.change === 'removed'} class:added={l.change === 'added'} open={acts(l)}>
      <summary dir="ltr">
        {#if l.change !== 'kept'}<span class="env-tag" class:on={l.change === 'added'}>{l.change === 'added' ? '+' : '−'}</span>{/if}
        <span class="tree-line">{sealed ? technical(`layer.${l.id}.name`) : summary(l.id, l.fields)}</span>
        {#if sealed}<span class="env-tag">{trl('peek.sealed')}</span>{/if}
      </summary>
      {#if l.change === 'removed'}<p class="tree-note">{tr('peek.off')}</p>{/if}
      {#if !sealed}
        <p class="tree-note" dir="auto">{fill(technical(`layer.${l.id}.note`), vars)}</p>
        {#if grid}
          <div class="diagram" dir="ltr" role="img" aria-label={technical(`layer.${l.id}.name`)}>
            {#each grid as row}
              {#each row as c}
                <span class="bitbox" class:used={c.f.used} class:changed={!!c.f.before} style:grid-column="{c.col + 1} / span {c.span}"
                  title="{technical(`layer.${l.id}.field.${c.f.id}.name`)} · {fill(tr('peek.bits'), { n: c.f.bits! })}">{c.first && c.span >= 4 ? technical(`layer.${l.id}.field.${c.f.id}.name`) : ''}</span>
              {/each}
            {/each}
          </div>
        {/if}
        <dl class="tree-fields">
          {#each l.fields as f (f.id)}
            <div class:used={f.used} class:changed={!!f.before}>
              <dt>{technical(`layer.${l.id}.field.${f.id}.name`)}{#if f.bits}<small> · {fill(tr('peek.bits'), { n: f.bits })}</small>{/if}</dt>
              <dd dir="ltr">{#if f.before}<Change was={f.before.text} now={f.value.key ? trl(f.value.key) : f.value.text} />{:else}{f.value.key ? trl(f.value.key) : f.value.text}{/if}</dd>
              <dd class="about" dir="auto">{trl(`layer.${l.id}.field.${f.id}.about`)}</dd>
            </div>
          {/each}
        </dl>
        {#if links.length}
          <p class="tree-more">{#each links as k, i}{#if i}{' · '}{/if}<a href={k.url} target="_blank" rel="noopener" lang={k.lang}>{k.title}</a>{/each}</p>
        {/if}
      {/if}
    </details>
  {/each}
</div>
