/**
 * "Our Family" — chapter five. Direct port of family.ejs.
 * Detail panel is opened client-side by /js/book.js (openFamilyDetail).
 */
import type { FC } from 'hono/jsx';

type Member = Record<string, any>;

type Props = {
  familyMembers: Member[];
  imageUrl: (path: string | null | undefined) => string | null;
  photoPos: (path: string | null | undefined) => string;
};

const Card: FC<{
  member: Member;
  imageUrl: (p: string | null | undefined) => string | null;
  photoPos: (p: string | null | undefined) => string;
}> = ({ member, imageUrl, photoPos }) => (
  <div class="family-card" onclick={`openFamilyDetail('${member.member_key}')`}>
    {member.photo_path ? (
      <div class="family-photo">
        <img
          src={imageUrl(member.photo_path) || ''}
          alt={member.name || ''}
          loading="lazy"
          style={photoPos(member.photo_path)}
        />
      </div>
    ) : (
      <div class="family-photo placeholder">{member.emoji || '👤'}</div>
    )}
    <div class="family-card-body">
      <div class="family-card-name">{member.name}</div>
      <div class="family-card-relation">{member.relation}</div>
      <p class="family-card-bio">Tap to read more.</p>
    </div>
  </div>
);

export const Family: FC<Props> = ({ familyMembers, imageUrl, photoPos }) => {
  const members = familyMembers || [];
  const parents = members.filter((fm) => fm.member_key === 'mom' || fm.member_key === 'dad');
  const rest = members.filter((fm) => fm.member_key !== 'mom' && fm.member_key !== 'dad');

  return (
    <>
      <section id="page-family" class="page-section">
        <div class="page-header">
          <div class="page-header-eyebrow">Chapter Five</div>
          <h2 class="page-header-title"><em>Our</em> Family</h2>
          <p class="page-header-sub">
            The people who loved your child before they even had a name.
          </p>
        </div>
        <div class="family-intro">
          <div class="family-tree-label">The People Who Make Up Your World</div>
          <p class="family-tree-sub">
            Every person in this section is someone whose life changed the day you were born. They
            come from different places, carry different stories, and together they form the village
            that will help raise you.
          </p>
        </div>

        {parents.length > 0 && (
          <>
            <div class="family-section-title">✦ Mom &amp; Dad</div>
            <div class="family-cards">
              {parents.map((fm) => (
                <Card key={fm.member_key} member={fm} imageUrl={imageUrl} photoPos={photoPos} />
              ))}
            </div>
          </>
        )}

        {rest.length > 0 && (
          <div class="family-cards">
            {rest.map((fm) => (
              <Card key={fm.member_key} member={fm} imageUrl={imageUrl} photoPos={photoPos} />
            ))}
          </div>
        )}
      </section>

      <div id="family-detail">
        <div class="fdetail-hero">
          <div class="fdetail-hero-overlay"></div>
          <button class="fdetail-back" onclick="closeFamilyDetail()">← Back to Family</button>
          <div class="fdetail-hero-text">
            <div class="fdetail-relation" id="fdetail-relation"></div>
            <div class="fdetail-name" id="fdetail-name"></div>
          </div>
        </div>
        <div class="fdetail-body">
          <div class="fdetail-meta" id="fdetail-meta"></div>
          <div class="fdetail-portrait-wrap" id="fdetail-portrait-wrap"></div>
          <div class="fdetail-story-label">✦ Their Story</div>
          <div class="fdetail-story" id="fdetail-story"></div>
          <div class="fdetail-quote" id="fdetail-quote"></div>
          <div class="fdetail-story" id="fdetail-story2"></div>
          <div class="fdetail-photos" id="fdetail-photos"></div>
        </div>
      </div>

      <div id="photo-lightbox" onclick="closeLightbox()">
        <button class="lightbox-close" onclick="closeLightbox()">✕</button>
        <img id="lightbox-img" src="" alt="" />
      </div>
    </>
  );
};
