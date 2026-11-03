// Layout do currículo em PDF, no estilo LaTeX. @react-pdf não interpreta HTML: cada valor vira texto puro.
import { createElement as h } from 'react';
import { Document, Font, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { fileURLToPath } from 'node:url';
import { STATUS } from '../src/lib/status.mjs';
import { UI } from '../src/lib/i18n.mjs';

const font = (name) => fileURLToPath(new URL(`../node_modules/computer-modern/fonts/cmu-serif-${name}.ttf`, import.meta.url));

Font.register({
  family: 'CMU Serif',
  fonts: [
    { src: font('500-roman'), fontWeight: 400 },
    { src: font('500-italic'), fontWeight: 400, fontStyle: 'italic' },
    { src: font('700-roman'), fontWeight: 700 },
    { src: font('700-italic'), fontWeight: 700, fontStyle: 'italic' },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const s = StyleSheet.create({
  page: { fontFamily: 'CMU Serif', fontSize: 10, lineHeight: 1.23, color: '#000', paddingVertical: 28, paddingHorizontal: 50 },
  name: { fontSize: 17, fontWeight: 700, lineHeight: 1.5, textAlign: 'center' },
  contact: { flexDirection: 'row', justifyContent: 'center', marginTop: 2 },
  sep: { marginHorizontal: 5 },
  link: { color: '#000', textDecoration: 'none' },
  h2: { fontSize: 12.5, fontWeight: 700, lineHeight: 1.3, marginTop: 9, marginBottom: 4, paddingBottom: 1, borderBottomWidth: 0.6, borderBottomColor: '#000' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  strong: { fontWeight: 700 },
  italic: { fontStyle: 'italic' },
  entry: { marginBottom: 5 },
  list: { marginTop: 2 },
  bullet: { flexDirection: 'row', paddingLeft: 8 },
  mark: { width: 10 },
  bulletText: { flex: 1, textAlign: 'justify' },
});

const Section = (title, ...children) => h(View, null, h(Text, { style: s.h2 }, title), ...children);

const Bullet = (children, key) =>
  h(View, { style: s.bullet, key }, h(Text, { style: s.mark }, '•'), h(Text, { style: s.bulletText }, children));

// Linha em negrito e linha em itálico, com o complemento alinhado à direita, como no modelo LaTeX.
const Entry = ({ title, place, subtitle, period, items = [], key }) =>
  h(
    View,
    { style: s.entry, key, wrap: false },
    h(View, { style: s.row }, h(Text, { style: s.strong }, title), place && h(Text, null, place)),
    h(View, { style: s.row }, h(Text, { style: s.italic }, subtitle), period && h(Text, { style: s.italic }, period)),
    items.length > 0 && h(View, { style: s.list }, ...items.map((text, i) => Bullet(text, i))),
  );

const Skill = (label, text) => Bullet([h(Text, { style: s.strong, key: 'label' }, `${label}: `), text], label);

export function ResumeDocument({ resume, lang }) {
  const t = UI[lang];
  const { person, contact, stack, projects, experience, education, languages, certifications, softSkills } = resume;
  const contactParts = [person.location, ...(contact.email ? [contact.email] : [])];
  const links = contact.links.map((l) => ({ ...l, text: l.url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '') }));
  // A MAIN já aparece em Experiência, com o mesmo conteúdo.
  const delivered = projects.filter((p) => p.status === 'done');

  return h(
    Document,
    { title: `${t.pdf.title} - ${person.fullName}`, author: person.fullName, language: t.htmlLang },
    h(
      Page,
      { size: 'A4', style: s.page },
      h(Text, { style: s.name }, person.fullName),
      h(
        View,
        { style: s.contact },
        ...contactParts.flatMap((part) => [h(Text, { key: part }, part), h(Text, { style: s.sep, key: `${part}-sep` }, '•')]),
        ...links.flatMap((l, i) => [
          i > 0 ? h(Text, { style: s.sep, key: `sep${i}` }, '•') : null,
          h(Link, { src: l.url, style: s.link, key: l.url }, l.text),
        ]),
      ),

      Section(
        t.pdf.projects,
        ...delivered.map((p) =>
          Entry({
            title: p.name,
            place: STATUS[p.status].label[lang].toLowerCase().replace(/^./, (c) => c.toUpperCase()),
            subtitle: `${p.context} · ${p.tags.join(', ')}`,
            items: [p.summary, ...p.highlights, p.deployment],
            key: p.name,
          }),
        ),
      ),

      Section(
        t.pdf.experience,
        ...experience.map((e) =>
          Entry({ title: e.company, place: e.location, subtitle: e.role, period: e.period, items: e.highlights, key: e.company }),
        ),
      ),

      Section(
        t.pdf.skills,
        ...stack.map((g) => Skill(g.group, `${g.items.join(', ')}.`)),
        Skill(t.certifications, `${certifications.map((c) => c.name).join(', ')}.`),
        Skill(t.pdf.soft, `${softSkills.join(', ')}.`),
        Skill(t.pdf.languages, `${languages.map((l) => `${l.name}: ${l.level}`).join('; ')}.`),
      ),

      Section(
        t.pdf.education,
        ...education.map((e) => Entry({ title: e.school, place: e.place, subtitle: e.course, period: e.period, key: e.course })),
      ),
    ),
  );
}
