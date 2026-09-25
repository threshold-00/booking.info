// Five made-up businesses layered over the dive demo, one per ?brand=. Each gets its own
// colours, typefaces and corner radius, so the site can show one engine wearing different brands.
(() => {
  const C = window.THRESHOLD_CONFIG;
  const brand = (/[?&]brand=([a-z]+)/.exec(location.search) || [])[1] || 'dive';
  const b64 = s => 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(s)));
  const logo = (top, sub, font, weight, colour, ls = 4, size = 40) => b64(
    `<svg xmlns="http://www.w3.org/2000/svg" width="396" height="92" viewBox="0 0 396 92"><text x="198" y="48" text-anchor="middle" font-family="${font}" font-size="${size}" font-weight="${weight}" letter-spacing="${ls}" fill="${colour}">${top}</text><text x="198" y="78" text-anchor="middle" font-family="${font}" font-size="15" letter-spacing="7" fill="${colour}" fill-opacity="0.7">${sub}</text></svg>`);
  const theme = (o) => {
    const c = o.c;
    return {
      colours: {
        ink: c.ink, ink2: c.ink, inkSoft: c.soft, muted: c.muted, paper: c.paper, paperAlt: c.paperAlt, sunken: c.paper,
        line: c.line, lineStrong: c.lineStrong, accent: c.accent, accentOnDark: c.paper, leaf: c.accent, dark: c.dark,
        onDark: c.paper, shade: c.pop, ok: c.ok || c.pop, okSurface: c.okSurface, warn: '#8a5a14', warnSurface: 'rgba(138,90,20,0.12)',
        chrome: c.dark, loadingBg: c.dark, loadingText: c.paper, loadingRing: 'rgba(255,255,255,0.18)'
      },
      fonts: o.fonts, type: { bodyTransform: 'none' }, radius: o.radius, logo: o.logo
    };
  };
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const palette = (ink, paper, paperAlt, accent, dark, pop) => ({
    ink, paper, paperAlt, accent, dark, pop, soft: rgba(ink, .72), muted: rgba(ink, .56), line: rgba(ink, .14), lineStrong: rgba(ink, .28), okSurface: rgba(pop, .12)
  });
  const swatch = (bg, fg) => b64(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="${bg}"/><circle cx="470" cy="90" r="160" fill="${fg}" fill-opacity=".18"/><circle cx="120" cy="360" r="120" fill="${fg}" fill-opacity=".12"/></svg>`);
  const fontHref = fams => 'https://fonts.googleapis.com/css2?' + fams.map(f => 'family=' + f).join('&') + '&display=swap';
  const common = (id, name, hero, ui) => {
    C.business = { ...C.business, id: 'demo-' + id, name, legalName: name, owner: 'the ' + name + ' team', refPrefix: name.slice(0, 2).toUpperCase() };
    C.dashboard = undefined;
    C.availability.static.booked = [];
    C.availability.calendar = undefined;
    C.copy = { ...C.copy, hero, notesPlaceholder: 'Anything we should know?', ui: { en: { ...C.copy.ui.en, ...ui } } };
  };
  const conf = (title, where, bring, arrival) => ({ title, address: where, mapsLink: 'Map link', bring, arrival });

  const B = {};

  B.dive = () => {
    C.theme = { ...theme({
      c: palette('#0d2b45', '#eef5f8', '#f8fbfc', '#0d2b45', '#0d2b45', '#1b7fa6'),
      fonts: { display: "'DM Serif Display', serif", body: "'DM Sans', sans-serif", mono: "'DM Mono', monospace", href: fontHref(['DM+Serif+Display', 'DM+Sans:wght@400;500', 'DM+Mono']) },
      radius: { card: 16, control: 10, pill: 999 },
      logo: logo('BLUE LEDGER', 'FREEDIVE', 'Didot, Georgia, serif', 400, '#eef5f8', 5, 38)
    }) };
  };

  B.studio = () => {
    const img = swatch('#e9d6c8', '#b76e5a');
    common('studio', 'Northlight Reformer', { title: 'Book a class', sub: 'Small reformer classes, all levels' },
      { chooseCategory: 'What would you like to book?', stepHeading2: '2. Who is coming?', aboutRiders: 'About you', rider: 'Client', sRiders: 'Clients', person: 'person', people: 'people', numPeople: 'Number of people' });
    C.theme = theme({
      c: palette('#3b2f2a', '#f6efe9', '#fbf7f3', '#3b2f2a', '#3b2f2a', '#b76e5a'),
      fonts: { display: "'Plus Jakarta Sans', sans-serif", body: "'Plus Jakarta Sans', sans-serif", mono: "'Plus Jakarta Sans', sans-serif", href: fontHref(['Plus+Jakarta+Sans:wght@300;400;500;600']) },
      radius: { card: 20, control: 14, pill: 999 },
      logo: logo('northlight', 'REFORMER', "'Helvetica Neue', Helvetica, Arial, sans-serif", 300, '#f6efe9', -1, 42)
    });
    C.categories = [{ id: 'classes', name: 'Reformer classes', intro: 'Small classes on the reformer. New to it? Start with the intro.', participantNoun: 'Client', bookOnBehalf: false }];
    C.activities = [
      { id: 'intro', category: 'classes', confirmationType: 'studio', name: 'Intro to Reformer', desc: 'One to one with an instructor. Springs, straps, set-up and the basics.', image: img, people: { min: 1, max: 1 }, pricing: { per: 'person' }, durations: [{ id: '50 min', label: '50 min', hours: 1, price: 40 }] },
      { id: 'open', category: 'classes', confirmationType: 'studio', name: 'Open Reformer', desc: 'A mixed-level 50 minute class, eight reformers.', image: img, people: { min: 1, max: 3 }, pricing: { per: 'person' }, durations: [{ id: '50 min', label: '50 min', hours: 1, price: 28 }] }
    ];
    C.screening = { questions: [
      { id: 'exp', type: 'choice', label: 'Reformer experience', short: 'exp', appliesTo: { all: true }, required: true,
        options: [{ value: 'none', label: 'Never tried it', outcome: 'pass' }, { value: 'intro', label: 'Done the intro here', outcome: 'pass' }, { value: 'regular', label: '6+ months elsewhere', outcome: 'pass' }],
        rule: { minValue: { default: 'none', open: 'intro' } },
        fail: { title: 'Open classes start after an intro', body: 'Open Reformer is for people who have done the intro here or six months on a reformer. The intro is 50 minutes, one to one. ', action: { label: 'Book the intro', toActivity: 'intro' } } },
      { id: 'injury', type: 'boolean', label: 'Any injury, recent surgery or pregnancy we should know about?', short: 'injury', appliesTo: { all: true }, required: true, outcomes: { true: 'flag', false: 'pass' },
        flag: { prompt: 'Thanks. Your instructor will check in before class.', operatorNote: 'check in before class' } }
    ] };
    C.availability.activities = { intro: { openWeekdays: [1, 2, 3, 4, 5, 6], slots: ['7:00am', '12:00pm'], capacity: 1 }, open: { openWeekdays: [1, 2, 3, 4, 5, 6], slots: ['7:00am', '9:30am', '6:00pm'], capacity: 8 } };
    C.confirmation.types = { studio: conf('Your class', 'Northlight Reformer, 12 Example St', 'Grip socks and water.', '10 minutes early.') };
  };

  B.climb = () => {
    const img = swatch('#2a2d30', '#e2572b');
    common('climb', 'Ridgeline Climbing', { title: 'Book a session', sub: 'Bouldering, top rope and lead' },
      { chooseCategory: 'What are you climbing?', stepHeading2: '2. Who is climbing?', aboutRiders: 'About the climbers', rider: 'Climber', sRiders: 'Climbers', person: 'climber', people: 'climbers', numPeople: 'Number of climbers' });
    C.theme = theme({
      c: palette('#1d1f21', '#f1f0ec', '#f8f7f4', '#e2572b', '#1d1f21', '#e2572b'),
      fonts: { display: "'Oswald', sans-serif", body: "'Barlow', sans-serif", mono: "'JetBrains Mono', monospace", href: fontHref(['Oswald:wght@500;600', 'Barlow:wght@400;500', 'JetBrains+Mono']) },
      radius: { card: 2, control: 2, pill: 2 },
      logo: logo('RIDGELINE', 'CLIMBING GYM', 'Impact, Haettenschweiler, sans-serif', 400, '#f1f0ec', 6, 44)
    });
    C.categories = [{ id: 'climb', name: 'Climbing', intro: 'Top rope and lead need a belay check first. Bouldering is open to all.', participantNoun: 'Climber', bookOnBehalf: false }];
    C.activities = [
      { id: 'check', category: 'climb', confirmationType: 'gym', name: 'Belay Check', desc: '20 minutes with staff. Pass it once, climb on the ropes any time.', image: img, people: { min: 1, max: 2 }, pricing: { per: 'person' }, durations: [{ id: '20 min', label: '20 min', hours: 1, price: 10 }] },
      { id: 'rope', category: 'climb', confirmationType: 'gym', name: 'Top Rope Session', desc: 'Two hours on the rope walls with your own partner.', image: img, people: { min: 1, max: 4 }, pricing: { per: 'person' }, durations: [{ id: '2 hr', label: '2 hr', hours: 2, price: 24 }] }
    ];
    C.screening = { questions: [
      { id: 'belay', type: 'choice', label: 'Belay experience', short: 'belay', appliesTo: { all: true }, required: true,
        options: [{ value: 'none', label: 'Never belayed', outcome: 'pass' }, { value: 'some', label: 'With a friend', outcome: 'pass' }, { value: 'cert', label: 'Checked here', outcome: 'pass' }],
        rule: { minValue: { default: 'none', rope: 'cert' } },
        fail: { title: 'Ropes need a belay check first', body: 'Everyone on the rope walls passes a 20 minute belay check with our staff. Do it once, it covers every visit after. ', action: { label: 'Book a belay check', toActivity: 'check' } } },
      { id: 'waiver', type: 'boolean', label: 'Signed our waiver before?', short: 'waiver', appliesTo: { all: true }, required: true, outcomes: { true: 'pass', false: 'flag' },
        flag: { prompt: 'No problem, we will send it with your confirmation.', operatorNote: 'waiver to sign' } }
    ] };
    C.availability.activities = { check: { openWeekdays: [0, 1, 2, 3, 4, 5, 6], slots: ['5:00pm', '6:00pm'], capacity: 2 }, rope: { openWeekdays: [0, 1, 2, 3, 4, 5, 6], slots: ['10:00am', '6:00pm'], capacity: 12 } };
    C.confirmation.types = { gym: conf('Your session', 'Ridgeline Climbing, 4 Example Rd', 'Climbing shoes if you have them. Hire is at the desk.', '10 minutes early.') };
  };

  B.dog = () => {
    const img = swatch('#f2b631', '#20352b');
    common('dog', 'Good Dog Club', { title: 'Book a day', sub: 'Day care, walks and baths' },
      { chooseCategory: 'What does your dog need?', stepHeading2: '2. Which dogs?', aboutRiders: 'About your dogs', rider: 'Dog', sRiders: 'Dogs', person: 'dog', people: 'dogs', numPeople: 'Number of dogs' });
    C.theme = theme({
      c: palette('#20352b', '#fbf6e9', '#fffcf4', '#20352b', '#20352b', '#2f7d4f'),
      fonts: { display: "'Fredoka', sans-serif", body: "'Nunito', sans-serif", mono: "'Nunito', sans-serif", href: fontHref(['Fredoka:wght@500;600', 'Nunito:wght@400;600']) },
      radius: { card: 22, control: 16, pill: 999 },
      logo: logo('Good Dog Club', 'DAY CARE', 'Chalkboard SE, Marker Felt, Comic Sans MS, sans-serif', 700, '#fbf6e9', 1, 40)
    });
    C.categories = [{ id: 'care', name: 'Day care', intro: 'Small groups, matched by size and energy.', participantNoun: 'Dog', bookOnBehalf: false }];
    C.activities = [
      { id: 'day', category: 'care', confirmationType: 'care', name: 'Full Day Care', desc: 'Drop off 7 to 9am, pick up by 6pm. Two group walks and a nap.', image: img, people: { min: 1, max: 3 }, pricing: { per: 'person' }, durations: [{ id: 'Full day', label: 'Full day', hours: 9, price: 48 }] }
    ];
    C.screening = { questions: [
      { id: 'vax', type: 'boolean', label: 'Vaccinations up to date (C5)?', short: 'C5', appliesTo: { all: true }, required: true, outcomes: { true: 'pass', false: 'fail' },
        fail: { title: 'We need a current C5 first', body: 'Every dog in the group needs an up to date C5. Book in once your vet has done it.' } },
      { id: 'desexed', type: 'boolean', label: 'Desexed?', short: 'desexed', appliesTo: { all: true }, required: true, outcomes: { true: 'pass', false: 'flag' },
        flag: { prompt: 'Thanks. We will place them in a smaller group.', operatorNote: 'not desexed, small group' } }
    ] };
    C.availability.activities = { day: { openWeekdays: [1, 2, 3, 4, 5], slots: ['7:00am'], capacity: 20 } };
    C.confirmation.types = { care: conf("Biscuit's day", 'Good Dog Club, 9 Example Lane', 'Lead, collar with tag, and lunch if they are on special food.', 'Drop off between 7 and 9am.') };
  };

  B.tattoo = () => {
    const img = swatch('#1a1a1a', '#b3261e');
    common('tattoo', 'Blackline Tattoo', { title: 'Book an appointment', sub: 'Custom work and flash' },
      { chooseCategory: 'What are you after?', stepHeading2: '2. About you', aboutRiders: 'Your details', rider: 'Client', sRiders: 'Clients', person: 'person', people: 'people', numPeople: 'Number of people' });
    C.theme = theme({
      c: palette('#111111', '#efece6', '#f7f5f1', '#b3261e', '#111111', '#b3261e'),
      fonts: { display: "'Space Grotesk', sans-serif", body: "'Space Grotesk', sans-serif", mono: "'Space Mono', monospace", href: fontHref(['Space+Grotesk:wght@400;500;700', 'Space+Mono']) },
      radius: { card: 0, control: 0, pill: 0 },
      logo: logo('BLACKLINE', 'TATTOO STUDIO', 'American Typewriter, Courier New, monospace', 700, '#efece6', 8, 40)
    });
    C.categories = [{ id: 'ink', name: 'Tattoos', intro: 'Flash from the wall, or a custom piece designed with you.', participantNoun: 'Client', bookOnBehalf: false }];
    C.activities = [
      { id: 'consult', category: 'ink', confirmationType: 'studio', name: 'Design Consult', desc: 'Free, 30 minutes. Placement, size, reference and a quote.', image: img, people: { min: 1, max: 1 }, pricing: { per: 'person' }, durations: [{ id: '30 min', label: '30 min', hours: 1, price: 0 }] },
      { id: 'custom', category: 'ink', confirmationType: 'studio', name: 'Custom Session', desc: 'A half day in the chair for a piece we have designed together.', image: img, people: { min: 1, max: 1 }, pricing: { per: 'person' }, durations: [{ id: 'Half day', label: 'Half day', hours: 4, price: 150 }] }
    ];
    C.screening = { questions: [
      { id: 'age', type: 'boolean', label: 'Are you 18 or over?', short: '18+', appliesTo: { all: true }, required: true, outcomes: { true: 'pass', false: 'fail' },
        fail: { title: 'We only tattoo over 18s', body: 'That is the law here, with or without a parent.' } },
      { id: 'design', type: 'choice', label: 'Where is the design at?', short: 'design', appliesTo: { all: true }, required: true,
        options: [{ value: 'idea', label: 'Just an idea', outcome: 'pass' }, { value: 'approved', label: 'Approved at my consult', outcome: 'pass' }],
        rule: { minValue: { default: 'idea', custom: 'approved' } },
        fail: { title: 'Custom pieces start with a consult', body: 'We design it with you first, so the session goes on the drawing, not the guessing. Consults are free. ', action: { label: 'Book a consult', toActivity: 'consult' } } }
    ] };
    C.availability.activities = { consult: { openWeekdays: [2, 3, 4, 5, 6], slots: ['11:00am', '4:00pm'], capacity: 1 }, custom: { openWeekdays: [2, 3, 4, 5, 6], slots: ['11:00am'], capacity: 1 } };
    C.confirmation.types = { studio: conf('Your appointment', 'Blackline Tattoo, 21 Example St', 'ID and your reference images.', 'On time, fed and hydrated.') };
  };

  (B[brand] || B.dive)();
})();
