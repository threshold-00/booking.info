// Google reviews block (design system 6.23), shared by the business-demo and Salty Cowboy
// builders. Returns '' when a business has no `reviews` data, so nothing is shown until
// real reviews are loaded. Never write placeholder reviews, ratings or names here.
//
// reviews: { place_name, rating, count, write_url, items: [{ author, date: 'YYYY-MM-DD', rating, text }] }
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stars = (n) => `<span class="stars" style="--rating:${Number(n)}" role="img" aria-label="${Number(n)} out of 5"></span>`;

export function renderReviews(r, slug = 'business') {
  if (!r || !Array.isArray(r.items) || !r.items.length) return '';
  if (!/^https:\/\//.test(r.write_url ?? '')) throw new Error(`${slug}: reviews.write_url must be an https link`);
  for (const x of r.items) {
    if (!x.author || !x.text || !(x.rating >= 1 && x.rating <= 5)) throw new Error(`${slug}: each review needs author, text and a 1 to 5 rating`);
  }
  const items = r.items.map((x) => `
          <li class="review">
            <div class="review__head"><span class="review__author">${esc(x.author)}</span><span class="review__src">Google</span></div>
            <p class="review__date">${esc(x.date ?? '')}</p>
            ${stars(x.rating)}
            <p class="review__text">${esc(x.text)}</p>
            <button type="button" class="review__more" hidden>Read more</button>
          </li>`).join('');
  return `
      <section class="reviews" aria-labelledby="h-reviews">
        <h2 id="h-reviews">Google reviews</h2>
        <div class="reviews__layout">
          <div class="reviews__sum">
            <p class="reviews__name">${esc(r.place_name)}</p>
            ${stars(r.rating)}
            <p class="reviews__count">${Number(r.count)} Google review${Number(r.count) === 1 ? '' : 's'}</p>
            <a class="reviews__write" href="${esc(r.write_url)}" target="_blank" rel="noopener">Write a review</a>
          </div>
          <div class="reviews__wrap">
            <button type="button" class="reviews__nav reviews__nav--prev" aria-label="Previous reviews" disabled>&lsaquo;</button>
            <ul class="reviews__rail" tabindex="0" aria-label="Google reviews">${items}
            </ul>
            <button type="button" class="reviews__nav reviews__nav--next" aria-label="Next reviews">&rsaquo;</button>
          </div>
        </div>
      </section>`;
}
