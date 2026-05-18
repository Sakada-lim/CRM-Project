<template>
  <div class="cd-shell">
    <!-- Breadcrumb -->
    <div class="cd-breadcrumb">
      <RouterLink to="/customers" class="cd-breadcrumb__home">Existing customers</RouterLink>
      <AppIcon name="chevron" :size="12" />
      <span class="cd-breadcrumb__name">{{ editable.name || 'Customer details' }}</span>
    </div>

    <!-- Hero card -->
    <section class="cd-card cd-hero">
      <div class="cd-hero__main">
        <div class="cd-hero__avatar" :data-tone="avatarTone">{{ initials }}</div>
        <div class="cd-hero__id">
          <div class="cd-hero__name-row">
            <h1 class="cd-hero__name">{{ editable.name || 'Customer details' }}</h1>
            <span v-if="editable.category" class="pill" :class="categoryToneClass(editable.category)">
              <span class="dot"></span>{{ editable.category }}
            </span>
            <RouterLink :to="`/customers/${id}/assessment`" class="btn btn-primary cd-hero__assess-btn">
              {{ assessmentCtaLabel }}
              <AppIcon name="chevron" :size="12" />
            </RouterLink>
          </div>
          <div class="cd-hero__contact">
            <span class="cd-hero__contact-item">
              <AppIcon name="phone" :size="13" />
              {{ editable.phone || '—' }}
            </span>
            <span class="cd-hero__contact-item">
              <AppIcon name="mail" :size="13" />
              {{ editable.email || '—' }}
            </span>
          </div>
        </div>
      </div>

      <div class="cd-hero__stats">
        <div class="cd-hero__stat">
          <div class="cd-hero__stat-eyebrow">Last follow-up</div>
          <div class="cd-hero__stat-v">{{ lastContactedShort }}</div>
          <div class="cd-hero__stat-s">{{ lastContactedSub }}</div>
        </div>
        <div class="cd-hero__stat">
          <div class="cd-hero__stat-eyebrow">Next follow-up</div>
          <div class="cd-hero__stat-v" :data-tone="nextContactTone">{{ nextContactShort }}</div>
          <div class="cd-hero__stat-s" :data-tone="nextContactTone">{{ nextContactSub }}</div>
        </div>
      </div>
    </section>

    <!-- DESKTOP: Two-column body (Basic + tab card on left, Follow-up + Telegram on right) -->
    <div v-if="!isCompact" class="cd-body">
      <!-- LEFT column -->
      <div class="cd-body__main">
        <!-- Basic information -->
        <section class="cd-card cd-card--pad">
          <div class="cd-sec-title">
            <h3>Basic information</h3>
            <span class="cd-sec-title__sub">All fields editable</span>
          </div>

          <div class="cd-form-grid">
            <div class="field" :class="{ 'is-error': errors.name }">
              <label for="cd-name">Full name</label>
              <input id="cd-name" v-model="editable.name" type="text" class="input" autocomplete="name"
                     :maxlength="LIMITS.name.max"
                     @input="clearError('name')" @blur="validateField('name')" />
              <p v-if="errors.name" class="field-error">{{ errors.name }}</p>
              <p v-if="duplicates.name" class="cd-dup-warn">
                <AppIcon name="user" :size="12" />
                Same name as
                <RouterLink :to="`/customers/${duplicates.name.id}`" class="cd-dup-link">
                  {{ duplicates.name.name }}
                </RouterLink>
                — different person? Save anyway.
              </p>
            </div>
            <div class="field" :class="{ 'is-error': errors.phone }">
              <label for="cd-phone">Phone</label>
              <div class="input-affix">
                <span class="prefix"><AppIcon name="phone" :size="14" /></span>
                <input id="cd-phone" v-model="editable.phone" type="tel" class="input has-prefix" autocomplete="tel"
                       :maxlength="LIMITS.phone.max"
                       @input="clearError('phone')" @blur="validateField('phone'); checkDuplicates()" />
              </div>
              <p v-if="errors.phone" class="field-error">{{ errors.phone }}</p>
              <p v-if="duplicates.phone" class="cd-dup-error">
                <AppIcon name="phone" :size="12" />
                This phone already belongs to
                <RouterLink :to="`/customers/${duplicates.phone.id}`" class="cd-dup-link">
                  {{ duplicates.phone.name || 'an existing customer' }}
                </RouterLink>
              </p>
            </div>
            <div class="field" :class="{ 'is-error': errors.email }">
              <label for="cd-email">Email</label>
              <div class="input-affix">
                <span class="prefix"><AppIcon name="mail" :size="14" /></span>
                <input id="cd-email" v-model="editable.email" type="email" class="input has-prefix" autocomplete="email"
                       :maxlength="LIMITS.email.max"
                       @input="clearError('email')" @blur="validateField('email'); checkDuplicates()" />
              </div>
              <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
              <p v-if="duplicates.email" class="cd-dup-error">
                <AppIcon name="mail" :size="12" />
                This email already belongs to
                <RouterLink :to="`/customers/${duplicates.email.id}`" class="cd-dup-link">
                  {{ duplicates.email.name || 'an existing customer' }}
                </RouterLink>
              </p>
            </div>
            <div class="field" :class="{ 'is-error': errors.agent }">
              <label for="cd-agent">Agent</label>
              <div class="input-affix">
                <span class="prefix"><AppIcon name="user" :size="14" /></span>
                <input id="cd-agent" v-model="editable.agent" type="text" class="input has-prefix" placeholder="e.g. Sarah Liang"
                       :maxlength="LIMITS.agent.max"
                       @input="clearError('agent')" @blur="validateField('agent')" />
              </div>
              <p v-if="errors.agent" class="field-error">{{ errors.agent }}</p>
            </div>
            <div class="field">
              <label for="cd-channel">Preferred channel</label>
              <select id="cd-channel" v-model="editable.channel" class="select">
                <option v-for="ch in CHANNELS" :key="ch" :value="ch">{{ ch }}</option>
              </select>
            </div>
            <div class="field">
              <label for="cd-category">Category</label>
              <select id="cd-category" v-model="editable.category" class="select">
                <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>

          <div class="cd-form-notes">
            <div class="field" :class="{ 'is-error': errors.notes }">
              <div class="field-head">
                <label for="cd-notes">Internal notes</label>
                <span class="field-action">Only visible to your team</span>
              </div>
              <textarea
                id="cd-notes"
                v-model="editable.notes"
                class="textarea"
                rows="3"
                placeholder="Family details, preferences, anything important to remember…"
                :maxlength="LIMITS.notes.max"
                @input="clearError('notes')" @blur="validateField('notes')"
              ></textarea>
              <p v-if="errors.notes" class="field-error">{{ errors.notes }}</p>
            </div>
          </div>

          <div class="cd-card__actions">
            <button class="btn btn-ghost" :disabled="!isDirty" @click="resetChanges">Reset</button>
            <button class="btn btn-primary" :disabled="!isDirty || saving" @click="saveChanges">
              <AppIcon name="check" :size="14" />
              {{ saving ? 'Saving…' : 'Save changes' }}
            </button>
          </div>

          <div class="cd-danger-zone">
            <div class="cd-danger-zone__text">
              <strong>Delete this customer</strong>
              <span>Permanent. Removes interactions, interests, and assessment data.</span>
            </div>
            <button type="button" class="btn cd-btn-danger" @click="deleteDialog = true">
              <AppIcon name="x" :size="14" />
              Delete customer
            </button>
          </div>
        </section>

        <!-- Activity + Interests tabbed card -->
        <section class="cd-card cd-tab-card">
          <div class="tabs" role="tablist">
            <button
              role="tab"
              :aria-pressed="activeTab === 'interactions'"
              @click="activeTab = 'interactions'"
            >
              Interactions
              <span v-if="feedbackEntries.length" class="tab-ct">{{ feedbackEntries.length }}</span>
            </button>
            <button
              role="tab"
              :aria-pressed="activeTab === 'properties'"
              @click="activeTab = 'properties'"
            >
              Interested properties
              <span v-if="totalInterests" class="tab-ct">{{ totalInterests }}</span>
            </button>
          </div>

          <div class="cd-tab-body">
            <Transition name="tab-fade" mode="out-in">
              <div v-if="activeTab === 'interactions'" key="interactions" class="tab-panel">
                <div class="cd-tab-subhead">
                  <span class="cd-tab-subhead__meta">
                    {{ feedbackEntries.length }} note{{ feedbackEntries.length === 1 ? '' : 's' }}
                    <template v-if="firstFeedbackDate"> · since {{ firstFeedbackDate }}</template>
                  </span>
                </div>

                <!-- Quick add -->
                <div class="cd-quickadd">
                  <textarea
                    v-model="newFeedback"
                    class="textarea"
                    rows="2"
                    placeholder="Log a quick note from the last interaction…"
                    :maxlength="LIMITS.notes.max"
                  ></textarea>
                  <div class="cd-quickadd__row">
                    <div class="cd-typepick" role="group">
                      <button
                        v-for="t in INTERACTION_TYPES"
                        :key="t.value"
                        type="button"
                        class="cd-typepick__btn"
                        :data-tone="t.tone"
                        :aria-pressed="quickType === t.value"
                        @click="quickType = t.value"
                      >
                        <AppIcon :name="t.icon" :size="12" />
                        {{ t.label }}
                      </button>
                    </div>
                    <button
                      class="btn btn-primary sm"
                      :disabled="!newFeedback.trim() || addingFeedback"
                      @click="addFeedback"
                    >
                      <AppIcon name="plus" :size="13" />
                      Log activity
                    </button>
                  </div>
                </div>

                <!-- Filter tabs -->
                <div v-if="feedbackEntries.length" class="cd-filters" role="tablist">
                  <button
                    v-for="opt in filterOptions"
                    :key="opt.value"
                    type="button"
                    class="cd-filter-tab"
                    :aria-pressed="filterType === opt.value"
                    @click="filterType = opt.value"
                  >
                    {{ opt.label }}
                    <span class="cd-filter-tab__count">{{ opt.count }}</span>
                  </button>
                </div>

                <!-- Timeline -->
                <div v-if="filteredFeedback.length" class="cd-timeline">
                  <div v-for="entry in filteredFeedback" :key="entry.id" class="cd-timeline__entry">
                    <div class="cd-timeline__bullet" :data-tone="metaFor(entry.type).tone">
                      <AppIcon :name="metaFor(entry.type).icon" :size="12" />
                    </div>
                    <div class="cd-timeline__content">
                      <div class="cd-timeline__meta">
                        <span class="cd-timeline__type">{{ metaFor(entry.type).label }}</span>
                        <span
                          v-if="entry.type === 'call' && entry.durationMinutes"
                          class="cd-timeline__duration"
                        >· {{ entry.durationMinutes }} min</span>
                        <span class="cd-timeline__when">{{ formatDateTime(entry.date) }}</span>
                      </div>
                      <p class="cd-timeline__body">{{ entry.note }}</p>
                    </div>
                  </div>
                </div>
                <div v-else-if="feedbackEntries.length" class="cd-timeline-empty">
                  No {{ filterOptions.find((o) => o.value === filterType)?.label.toLowerCase() }} in this customer's history.
                </div>
                <div v-else class="cd-timeline-empty">
                  No interactions logged yet. Add one above to start tracking touchpoints.
                </div>
              </div>

              <div v-else key="properties" class="tab-panel">
                <div class="cd-tab-subhead">
                  <span class="cd-tab-subhead__meta">
                    {{ totalInterests }} linked propert{{ totalInterests === 1 ? 'y' : 'ies' }}
                  </span>
                  <button class="btn btn-ghost sm" @click="onMatchProperty">
                    <AppIcon name="plus" :size="13" />
                    Match property
                  </button>
                </div>
                <CustomerInterestsPanel ref="interestsPanel" :customer-id="id" />
              </div>
            </Transition>
          </div>
        </section>

      </div>

      <!-- RIGHT column -->
      <aside class="cd-body__aside">
        <!-- Follow-up -->
        <section class="cd-card cd-card--pad-sm">
          <div class="cd-sec-title">
            <h3>Follow-up</h3>
            <span v-if="statusBadge" class="pill" :class="statusBadge.cls">
              <span class="dot"></span>{{ statusBadge.label }}
            </span>
          </div>

          <div class="field">
            <label for="cd-last">Last follow-up</label>
            <div class="input-affix">
              <span class="prefix"><AppIcon name="clock" :size="14" /></span>
              <input
                id="cd-last"
                :value="lastContactedDateInput"
                type="datetime-local"
                class="input has-prefix"
                @change="onLastContactedChange"
              />
            </div>
          </div>

          <div class="field" style="margin-top: 12px">
            <label for="cd-next">Next follow-up</label>
            <div class="input-affix">
              <span class="prefix"><AppIcon name="calendar" :size="14" /></span>
              <input
                id="cd-next"
                v-model="nextContactInput"
                type="datetime-local"
                class="input has-prefix"
                @change="saveNextContact"
              />
            </div>
          </div>

          <div class="cd-chips">
            <button v-for="q in quickChips" :key="q.label" class="btn btn-ghost sm" @click="applyQuickChip(q)">
              {{ q.label }}
            </button>
            <button
              v-if="editable.nextContactAt"
              class="btn btn-quiet sm cd-chips__clear"
              @click="clearNextContact"
            >
              <AppIcon name="x" :size="11" />
              Clear
            </button>
          </div>

          <button class="btn btn-primary cd-mark-btn" @click="markContactedDialog = true">
            <AppIcon name="check" :size="14" />
            Mark followed up now
          </button>
        </section>

        <!-- Buying profile -->
        <BuyingProfilePanel :customer-id="id" />

        <!-- Telegram enrollment -->
        <section class="cd-card cd-card--pad-sm">
          <div class="cd-sec-title">
            <h3>Telegram</h3>
            <span v-if="editable.telegramChatId" class="pill success">
              <span class="dot"></span>Enrolled
            </span>
            <span v-else class="pill muted">Not enrolled</span>
          </div>

          <template v-if="editable.telegramChatId">
            <p class="cd-telegram__hint">
              This customer will receive Telegram broadcasts you send from any property they're interested in.
            </p>
          </template>
          <template v-else>
            <p class="cd-telegram__hint">
              Ask them to message <strong>@BoldVisionPropertiesBot</strong> with the command below to enrol.
            </p>
            <div class="cd-telegram__token">
              <code>/start {{ editable.telegramEnrollmentToken }}</code>
              <button class="btn btn-quiet icon sm" aria-label="Copy command" @click="copyEnrollment">
                <AppIcon name="check" v-if="copied" :size="13" />
                <AppIcon name="edit" v-else :size="13" />
              </button>
            </div>
          </template>
        </section>
      </aside>
    </div>

    <!-- COMPACT (iPad / iPhone): single tab card with Profile / Interactions / Properties -->
    <section v-if="isCompact" class="cd-card cd-tab-card">
      <div class="tabs" role="tablist">
        <button role="tab" :aria-pressed="activeTab === 'profile'" @click="activeTab = 'profile'">
          Profile
        </button>
        <button role="tab" :aria-pressed="activeTab === 'interactions'" @click="activeTab = 'interactions'">
          Interactions
          <span v-if="feedbackEntries.length" class="tab-ct">{{ feedbackEntries.length }}</span>
        </button>
        <button role="tab" :aria-pressed="activeTab === 'properties'" @click="activeTab = 'properties'">
          Properties
          <span v-if="totalInterests" class="tab-ct">{{ totalInterests }}</span>
        </button>
      </div>

      <div class="cd-tab-body">
        <Transition name="tab-fade" mode="out-in">
          <!-- ── Profile tab: Basic info + Follow-up + Telegram stacked ── -->
          <div v-if="activeTab === 'profile'" key="profile" class="tab-panel">
            <!-- Basic info section -->
            <div class="cd-profile-section">
              <div class="cd-sec-title">
                <h3>Basic information</h3>
                <span class="cd-sec-title__sub">All fields editable</span>
              </div>
              <div class="cd-form-grid">
                <div class="field" :class="{ 'is-error': errors.name }">
                  <label for="cdm-name">Full name</label>
                  <input id="cdm-name" v-model="editable.name" type="text" class="input" autocomplete="name"
                         :maxlength="LIMITS.name.max"
                         @input="clearError('name')" @blur="validateField('name')" />
                  <p v-if="errors.name" class="field-error">{{ errors.name }}</p>
                  <p v-if="duplicates.name" class="cd-dup-warn">
                    <AppIcon name="user" :size="12" />
                    Same name as
                    <RouterLink :to="`/customers/${duplicates.name.id}`" class="cd-dup-link">
                      {{ duplicates.name.name }}
                    </RouterLink>
                    — different person? Save anyway.
                  </p>
                </div>
                <div class="field" :class="{ 'is-error': errors.phone }">
                  <label for="cdm-phone">Phone</label>
                  <div class="input-affix">
                    <span class="prefix"><AppIcon name="phone" :size="14" /></span>
                    <input id="cdm-phone" v-model="editable.phone" type="tel" class="input has-prefix" autocomplete="tel"
                           :maxlength="LIMITS.phone.max"
                           @input="clearError('phone')" @blur="validateField('phone'); checkDuplicates()" />
                  </div>
                  <p v-if="errors.phone" class="field-error">{{ errors.phone }}</p>
                  <p v-if="duplicates.phone" class="cd-dup-error">
                    <AppIcon name="phone" :size="12" />
                    This phone already belongs to
                    <RouterLink :to="`/customers/${duplicates.phone.id}`" class="cd-dup-link">
                      {{ duplicates.phone.name || 'an existing customer' }}
                    </RouterLink>
                  </p>
                </div>
                <div class="field" :class="{ 'is-error': errors.email }">
                  <label for="cdm-email">Email</label>
                  <div class="input-affix">
                    <span class="prefix"><AppIcon name="mail" :size="14" /></span>
                    <input id="cdm-email" v-model="editable.email" type="email" class="input has-prefix" autocomplete="email"
                           :maxlength="LIMITS.email.max"
                           @input="clearError('email')" @blur="validateField('email'); checkDuplicates()" />
                  </div>
                  <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
                  <p v-if="duplicates.email" class="cd-dup-error">
                    <AppIcon name="mail" :size="12" />
                    This email already belongs to
                    <RouterLink :to="`/customers/${duplicates.email.id}`" class="cd-dup-link">
                      {{ duplicates.email.name || 'an existing customer' }}
                    </RouterLink>
                  </p>
                </div>
                <div class="field" :class="{ 'is-error': errors.agent }">
                  <label for="cdm-agent">Agent</label>
                  <div class="input-affix">
                    <span class="prefix"><AppIcon name="user" :size="14" /></span>
                    <input id="cdm-agent" v-model="editable.agent" type="text" class="input has-prefix" placeholder="e.g. Sarah Liang"
                           :maxlength="LIMITS.agent.max"
                           @input="clearError('agent')" @blur="validateField('agent')" />
                  </div>
                  <p v-if="errors.agent" class="field-error">{{ errors.agent }}</p>
                </div>
                <div class="field">
                  <label for="cdm-channel">Preferred channel</label>
                  <select id="cdm-channel" v-model="editable.channel" class="select">
                    <option v-for="ch in CHANNELS" :key="ch" :value="ch">{{ ch }}</option>
                  </select>
                </div>
                <div class="field">
                  <label for="cdm-category">Category</label>
                  <select id="cdm-category" v-model="editable.category" class="select">
                    <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                </div>
              </div>
              <div class="cd-form-notes">
                <div class="field" :class="{ 'is-error': errors.notes }">
                  <div class="field-head">
                    <label for="cdm-notes">Internal notes</label>
                    <span class="field-action">Only visible to your team</span>
                  </div>
                  <textarea
                    id="cdm-notes"
                    v-model="editable.notes"
                    class="textarea"
                    rows="3"
                    placeholder="Family details, preferences, anything important to remember…"
                    :maxlength="LIMITS.notes.max"
                    @input="clearError('notes')" @blur="validateField('notes')"
                  ></textarea>
                  <p v-if="errors.notes" class="field-error">{{ errors.notes }}</p>
                </div>
              </div>
              <div class="cd-card__actions cd-profile-actions">
                <button class="btn btn-ghost" :disabled="!isDirty" @click="resetChanges">Reset</button>
                <button class="btn btn-primary" :disabled="!isDirty || saving" @click="saveChanges">
                  <AppIcon name="check" :size="14" />
                  {{ saving ? 'Saving…' : 'Save changes' }}
                </button>
              </div>

              <div class="cd-danger-zone">
                <div class="cd-danger-zone__text">
                  <strong>Delete this customer</strong>
                  <span>Permanent. Removes interactions, interests, and assessment data.</span>
                </div>
                <button type="button" class="btn cd-btn-danger" @click="deleteDialog = true">
                  <AppIcon name="x" :size="14" />
                  Delete customer
                </button>
              </div>
            </div>

            <!-- Follow-up section -->
            <div class="cd-profile-section">
              <div class="cd-sec-title">
                <h3>Follow-up</h3>
                <span v-if="statusBadge" class="pill" :class="statusBadge.cls">
                  <span class="dot"></span>{{ statusBadge.label }}
                </span>
              </div>
              <div class="field">
                <label for="cdm-last">Last follow-up</label>
                <div class="input-affix">
                  <span class="prefix"><AppIcon name="clock" :size="14" /></span>
                  <input
                    id="cdm-last"
                    :value="lastContactedDateInput"
                    type="datetime-local"
                    class="input has-prefix"
                    @change="onLastContactedChange"
                  />
                </div>
              </div>
              <div class="field" style="margin-top: 12px">
                <label for="cdm-next">Next follow-up</label>
                <div class="input-affix">
                  <span class="prefix"><AppIcon name="calendar" :size="14" /></span>
                  <input
                    id="cdm-next"
                    v-model="nextContactInput"
                    type="datetime-local"
                    class="input has-prefix"
                    @change="saveNextContact"
                  />
                </div>
              </div>
              <div class="cd-chips">
                <button v-for="q in quickChips" :key="q.label" class="btn btn-ghost sm" @click="applyQuickChip(q)">
                  {{ q.label }}
                </button>
                <button v-if="editable.nextContactAt" class="btn btn-quiet sm cd-chips__clear" @click="clearNextContact">
                  <AppIcon name="x" :size="11" />
                  Clear
                </button>
              </div>
              <button class="btn btn-primary cd-mark-btn" @click="markContactedDialog = true">
                <AppIcon name="check" :size="14" />
                Mark followed up now
              </button>
            </div>

            <!-- Buying profile section -->
            <div class="cd-profile-section">
              <BuyingProfilePanel :customer-id="id" />
            </div>

            <!-- Telegram section -->
            <div class="cd-profile-section">
              <div class="cd-sec-title">
                <h3>Telegram</h3>
                <span v-if="editable.telegramChatId" class="pill success">
                  <span class="dot"></span>Enrolled
                </span>
                <span v-else class="pill muted">Not enrolled</span>
              </div>
              <template v-if="editable.telegramChatId">
                <p class="cd-telegram__hint">
                  This customer will receive Telegram broadcasts you send from any property they're interested in.
                </p>
              </template>
              <template v-else>
                <p class="cd-telegram__hint">
                  Ask them to message <strong>@BoldVisionPropertiesBot</strong> with the command below to enrol.
                </p>
                <div class="cd-telegram__token">
                  <code>/start {{ editable.telegramEnrollmentToken }}</code>
                  <button class="btn btn-quiet icon sm" aria-label="Copy command" @click="copyEnrollment">
                    <AppIcon name="check" v-if="copied" :size="13" />
                    <AppIcon name="edit" v-else :size="13" />
                  </button>
                </div>
              </template>
            </div>
          </div>

          <!-- ── Interactions tab (same as desktop) ── -->
          <div v-else-if="activeTab === 'interactions'" key="interactions" class="tab-panel">
            <div class="cd-tab-subhead">
              <span class="cd-tab-subhead__meta">
                {{ feedbackEntries.length }} note{{ feedbackEntries.length === 1 ? '' : 's' }}
                <template v-if="firstFeedbackDate"> · since {{ firstFeedbackDate }}</template>
              </span>
            </div>
            <div class="cd-quickadd">
              <textarea
                v-model="newFeedback"
                class="textarea"
                rows="2"
                placeholder="Log a quick note from the last interaction…"
                :maxlength="LIMITS.notes.max"
              ></textarea>
              <div class="cd-quickadd__row">
                <div class="cd-typepick" role="group">
                  <button
                    v-for="t in INTERACTION_TYPES"
                    :key="t.value"
                    type="button"
                    class="cd-typepick__btn"
                    :data-tone="t.tone"
                    :aria-pressed="quickType === t.value"
                    @click="quickType = t.value"
                  >
                    <AppIcon :name="t.icon" :size="12" />
                    {{ t.label }}
                  </button>
                </div>
                <button
                  class="btn btn-primary sm"
                  :disabled="!newFeedback.trim() || addingFeedback"
                  @click="addFeedback"
                >
                  <AppIcon name="plus" :size="13" />
                  Log activity
                </button>
              </div>
            </div>
            <div v-if="feedbackEntries.length" class="cd-filters" role="tablist">
              <button
                v-for="opt in filterOptions"
                :key="opt.value"
                type="button"
                class="cd-filter-tab"
                :aria-pressed="filterType === opt.value"
                @click="filterType = opt.value"
              >
                {{ opt.label }}
                <span class="cd-filter-tab__count">{{ opt.count }}</span>
              </button>
            </div>
            <div v-if="filteredFeedback.length" class="cd-timeline">
              <div v-for="entry in filteredFeedback" :key="entry.id" class="cd-timeline__entry">
                <div class="cd-timeline__bullet" :data-tone="metaFor(entry.type).tone">
                  <AppIcon :name="metaFor(entry.type).icon" :size="12" />
                </div>
                <div class="cd-timeline__content">
                  <div class="cd-timeline__meta">
                    <span class="cd-timeline__type">{{ metaFor(entry.type).label }}</span>
                    <span
                      v-if="entry.type === 'call' && entry.durationMinutes"
                      class="cd-timeline__duration"
                    >· {{ entry.durationMinutes }} min</span>
                    <span class="cd-timeline__when">{{ formatDateTime(entry.date) }}</span>
                  </div>
                  <p class="cd-timeline__body">{{ entry.note }}</p>
                </div>
              </div>
            </div>
            <div v-else-if="feedbackEntries.length" class="cd-timeline-empty">
              No {{ filterOptions.find((o) => o.value === filterType)?.label.toLowerCase() }} in this customer's history.
            </div>
            <div v-else class="cd-timeline-empty">
              No interactions logged yet. Add one above to start tracking touchpoints.
            </div>
          </div>

          <!-- ── Properties tab ── -->
          <div v-else key="properties" class="tab-panel">
            <div class="cd-tab-subhead">
              <span class="cd-tab-subhead__meta">
                {{ totalInterests }} linked propert{{ totalInterests === 1 ? 'y' : 'ies' }}
              </span>
              <button class="btn btn-ghost sm" @click="onMatchProperty">
                <AppIcon name="plus" :size="13" />
                Match property
              </button>
            </div>
            <CustomerInterestsPanel ref="interestsPanel" :customer-id="id" />
          </div>
        </Transition>
      </div>
    </section>

    <!-- Mark contacted / Log activity dialog -->
    <v-dialog v-model="markContactedDialog" :max-width="600" :scrim="'rgba(15,23,42,0.65)'">
      <div class="modal-card">
        <header class="modal-head">
          <span class="ico"><AppIcon name="check" :size="18" /></span>
          <div class="modal-head__text">
            <h2>Log activity</h2>
            <div class="sub">Capture how you followed up and when to follow up next.</div>
          </div>
          <button class="close" aria-label="Close" @click="markContactedDialog = false">
            <AppIcon name="x" :size="16" />
          </button>
        </header>

        <div class="modal-body">
          <!-- Type picker -->
          <div class="field">
            <label>How did you follow up?</label>
            <div class="cd-typepick" role="group">
              <button
                v-for="t in INTERACTION_TYPES"
                :key="t.value"
                type="button"
                class="cd-typepick__btn"
                :data-tone="t.tone"
                :aria-pressed="mcType === t.value"
                @click="mcType = t.value"
              >
                <AppIcon :name="t.icon" :size="13" />
                {{ t.label }}
              </button>
            </div>
          </div>

          <!-- Note -->
          <div class="field">
            <label for="mc-note">Note</label>
            <textarea
              id="mc-note"
              v-model="mcNote"
              class="textarea"
              rows="3"
              placeholder="What was discussed? Any commitments or next steps?"
              :maxlength="LIMITS.notes.max"
            ></textarea>
          </div>

          <!-- Duration (calls only) -->
          <div v-if="mcType === 'call'" class="field cd-mc-duration">
            <label for="mc-duration">Call duration (minutes)</label>
            <input
              id="mc-duration"
              v-model.number="mcDuration"
              type="number"
              min="0"
              max="600"
              class="input"
              placeholder="e.g. 12"
            />
          </div>

          <!-- Schedule next contact section -->
          <div class="cd-mc-divider"></div>
          <div class="cd-mc-section">
            <div class="cd-mc-section__head">
              <h4>Schedule next follow-up</h4>
              <label class="cd-mc-skip">
                <input v-model="mcSkip" type="checkbox" />
                <span>Skip</span>
              </label>
            </div>
            <div class="field">
              <label for="mc-next">Next follow-up</label>
              <div class="input-affix">
                <span class="prefix"><AppIcon name="calendar" :size="14" /></span>
                <input
                  id="mc-next"
                  v-model="mcNextDate"
                  type="datetime-local"
                  class="input has-prefix"
                  :disabled="mcSkip"
                />
              </div>
            </div>
            <button
              class="btn btn-ghost sm cd-mc-default"
              :disabled="mcSkip || !editable.category"
              @click="mcApplyDefault"
            >
              Use default cadence ({{ cadenceLabel(editable.category) }})
            </button>
          </div>
        </div>

        <div class="modal-foot">
          <button class="btn btn-ghost" @click="markContactedDialog = false">Cancel</button>
          <button class="btn btn-primary" :disabled="!mcCanConfirm" @click="confirmMarkContacted">
            <AppIcon name="check" :size="14" />
            {{ mcSaving ? 'Saving…' : 'Log activity' }}
          </button>
        </div>
      </div>
    </v-dialog>

    <ConfirmDeleteDialog
      v-model="deleteDialog"
      entity-type="customer"
      :entity-label="editable.name"
      :busy="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useCustomerStore } from '../stores/customerStore'
import { useAssessmentStore } from '../stores/assessmentStore'
import {
  customerStatus,
  daysUntilContact,
  cadenceMonths,
  cadenceLabel,
} from '../utils/followUp'
import CustomerInterestsPanel from '../components/customer/CustomerInterestsPanel.vue'
import BuyingProfilePanel from '../components/customer/BuyingProfilePanel.vue'
import AppIcon from '../components/base/AppIcon.vue'
import ConfirmDeleteDialog from '../components/base/ConfirmDeleteDialog.vue'
import {
  validateCustomerForm,
  validateFeedback,
  validateRequired,
  validateMaxLength,
  validatePhone,
  validateEmail,
  findDuplicateCustomers,
  LIMITS,
} from '../utils/validators'
import { useFeedback } from '../composables/useFeedback'

const CHANNELS = ['Call', 'Telegram', 'SMS', 'Email']
const CATEGORIES = ['Hot', 'Warm', 'Cold']
const AVATAR_TONES = ['accent', 'warm', 'hot', 'cold']

const INTERACTION_TYPES = [
  { value: 'call',     label: 'Call',     icon: 'phone', tone: 'call'     },
  { value: 'email',    label: 'Email',    icon: 'mail',  tone: 'email'    },
  { value: 'sms',      label: 'SMS',      icon: 'chat',  tone: 'sms'      },
  { value: 'telegram', label: 'Telegram', icon: 'chat',  tone: 'telegram' },
  { value: 'note',     label: 'Note',     icon: 'edit',  tone: 'note'     },
]
const TYPE_META = Object.fromEntries(INTERACTION_TYPES.map((t) => [t.value, t]))
function metaFor(type) {
  return TYPE_META[type] ?? TYPE_META.note
}

const route = useRoute()
const router = useRouter()
const store = useCustomerStore()
const assessmentStore = useAssessmentStore()
const id = route.params.id

const deleteDialog = ref(false)
const deleting = ref(false)

async function confirmDelete() {
  if (deleting.value) return
  deleting.value = true
  try {
    await store.deleteCustomer(id)
    deleteDialog.value = false
    notifySuccess('Customer deleted')
    router.push('/customers')
  } catch (e) {
    notifyFromError(e, 'Failed to delete customer')
  } finally {
    deleting.value = false
  }
}

const assessment = computed(() => assessmentStore.forCustomer(id))
const assessmentCtaLabel = computed(() => {
  const a = assessment.value
  if (!a) return 'Start assessment'
  if (a.status === 'submitted') return 'View assessment'
  return 'Continue assessment'
})

const original = computed(() => store.customers.find((c) => c.id === id))
const customerFound = computed(() => !!original.value)

const editable = ref({
  id,
  name: '',
  phone: '',
  email: '',
  category: 'Cold',
  channel: 'Call',
  agent: '',
  notes: '',
  lastContactedAt: null,
  nextContactAt: null,
  telegramChatId: null,
  telegramEnrollmentToken: null,
})

watch(
  original,
  (val) => {
    if (val) editable.value = { ...editable.value, ...val }
  },
  { immediate: true },
)

// ── Derived ─────────────────────────────────────────────────────────────────

const initials = computed(() => {
  if (!editable.value.name) return '?'
  return editable.value.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?'
})

const avatarTone = computed(() => {
  const s = editable.value.name || editable.value.id || ''
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length]
})

function categoryToneClass(cat) {
  if (cat === 'Hot') return 'hot'
  if (cat === 'Warm') return 'warm'
  return 'cold'
}

// ── Dirty tracking + save/reset ────────────────────────────────────────────

const EDITABLE_FIELDS = ['name', 'phone', 'email', 'channel', 'category', 'agent', 'notes']
const isDirty = computed(() => {
  if (!original.value) return false
  return EDITABLE_FIELDS.some((f) => (editable.value[f] ?? '') !== (original.value[f] ?? ''))
})

const saving = ref(false)
const errors = ref({})
const duplicates = ref({})
const { notifySuccess, notifyError, notifyFromError } = useFeedback()

function checkDuplicates() {
  duplicates.value = findDuplicateCustomers(
    { phone: editable.value.phone, email: editable.value.email, name: editable.value.name },
    store.customers,
    { excludeId: id },
  )
}

const hasBlockingDuplicate = computed(
  () => !!(duplicates.value.phone || duplicates.value.email),
)

watch(
  () => [editable.value.phone, editable.value.email, editable.value.name, original.value?.id],
  () => checkDuplicates(),
  { immediate: true },
)

function clearError(field) {
  if (errors.value[field]) {
    const { [field]: _, ...rest } = errors.value
    errors.value = rest
  }
}

// Single-field validation on @blur. Composite isn't needed since the
// at-least-one-contact rule is enforced at the DB layer (the user can't
// blank out their only contact via this UI without seeing the toast).
function validateField(field) {
  let err = null
  const val = editable.value[field]
  switch (field) {
    case 'name':
      err = validateRequired(val, 'Name') ?? validateMaxLength(val, LIMITS.name.max, 'Name')
      break
    case 'phone':
      err = validatePhone(val)
      break
    case 'email':
      err = validateEmail(val)
      break
    case 'agent':
      err = validateMaxLength(val, LIMITS.agent.max, 'Agent')
      break
    case 'notes':
      err = validateMaxLength(val, LIMITS.notes.max, 'Notes')
      break
  }
  if (err) errors.value = { ...errors.value, [field]: err }
  else clearError(field)
}

async function saveChanges() {
  if (!customerFound.value || !isDirty.value) return
  // Run the full composite validator so the "at least one contact" rule fires
  // here too — the patch could end up clearing the only contact method.
  const result = validateCustomerForm(editable.value)
  if (result) {
    errors.value = result
    const first = result._ ?? Object.values(result)[0]
    notifyError(first)
    return
  }
  // Hard block on phone/email duplicates (name dup is just a soft warn)
  checkDuplicates()
  if (hasBlockingDuplicate.value) {
    const target = duplicates.value.phone ?? duplicates.value.email
    const field  = duplicates.value.phone ? 'phone number' : 'email'
    notifyError(`This ${field} already belongs to ${target.name || 'an existing customer'}.`)
    return
  }
  errors.value = {}
  saving.value = true
  try {
    await store.updateCustomer(id, { ...editable.value })
    notifySuccess('Changes saved')
  } catch (e) {
    notifyFromError(e, 'Failed to save')
  } finally {
    saving.value = false
  }
}

function resetChanges() {
  if (!original.value) return
  editable.value = { ...editable.value, ...original.value }
  errors.value = {}
}

// ── Hero stats ──────────────────────────────────────────────────────────────

function formatShortDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} · ${formatTime(iso)}`
}

const lastContactedShort = computed(() =>
  editable.value.lastContactedAt ? formatShortDate(editable.value.lastContactedAt) : 'Never',
)
const lastContactedSub = computed(() => {
  const v = editable.value.lastContactedAt
  if (!v) return 'No follow-up logged yet'
  return `${formatTime(v)} · ${editable.value.channel || 'Call'}`
})

const nextContactShort = computed(() => {
  const v = editable.value.nextContactAt
  if (!v) return 'Not scheduled'
  const days = daysUntilContact(editable.value)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 0) return `${Math.abs(days)}d overdue`
  return formatShortDate(v)
})
const nextContactSub = computed(() => {
  const v = editable.value.nextContactAt
  if (!v) return 'Set a date below'
  const days = daysUntilContact(editable.value)
  if (days === 0 || days === 1 || days < 0) return formatDateTime(v)
  return `in ${days} days`
})
const nextContactTone = computed(() => {
  const v = editable.value.nextContactAt
  if (!v) return 'muted'
  const days = daysUntilContact(editable.value)
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  return ''
})

// ── Follow-up sidebar ───────────────────────────────────────────────────────

const statusBadge = computed(() => {
  const s = customerStatus(editable.value)
  if (s === 'overdue') {
    const d = Math.abs(daysUntilContact(editable.value))
    return { label: `${d}d overdue`, cls: 'hot' }
  }
  if (s === 'approaching') {
    const d = daysUntilContact(editable.value)
    return { label: `Due in ${d}d`, cls: 'warm' }
  }
  if (s === 'never-contacted') return { label: 'No follow-ups yet', cls: 'muted' }
  if (s === 'unscheduled') return { label: 'No schedule', cls: 'muted' }
  return null
})

const lastContactedDateInput = computed(() => {
  if (!editable.value.lastContactedAt) return ''
  return new Date(editable.value.lastContactedAt).toISOString().slice(0, 16)
})

const nextContactInput = ref(
  editable.value.nextContactAt ? new Date(editable.value.nextContactAt).toISOString().slice(0, 16) : '',
)

watch(
  () => editable.value.nextContactAt,
  (val) => {
    nextContactInput.value = val ? new Date(val).toISOString().slice(0, 16) : ''
  },
)

const quickChips = computed(() => [
  { label: '+1 day', kind: 'days', amount: 1 },
  { label: '+3 days', kind: 'days', amount: 3 },
  { label: '+1 week', kind: 'days', amount: 7 },
  {
    label: `+${cadenceMonths(editable.value.category)} mo · ${editable.value.category || 'default'}`,
    kind: 'months',
    amount: cadenceMonths(editable.value.category),
  },
])

async function applyQuickChip(q) {
  const base = editable.value.lastContactedAt ? new Date(editable.value.lastContactedAt) : new Date()
  if (q.kind === 'days') base.setDate(base.getDate() + q.amount)
  else if (q.kind === 'months') base.setMonth(base.getMonth() + q.amount)
  const iso = base.toISOString()
  editable.value.nextContactAt = iso
  nextContactInput.value = iso.slice(0, 16)
  await store.setNextContactAt(id, iso)
}

async function onLastContactedChange(e) {
  const val = e.target.value
  if (!val) return
  const iso = new Date(val).toISOString()
  editable.value.lastContactedAt = iso
  await store.setLastContacted(id, iso)
}

async function saveNextContact() {
  const val = nextContactInput.value
  const iso = val ? new Date(val).toISOString() : null
  editable.value.nextContactAt = iso
  await store.setNextContactAt(id, iso)
}

async function clearNextContact() {
  editable.value.nextContactAt = null
  nextContactInput.value = ''
  await store.setNextContactAt(id, null)
}

// ── Mark contacted dialog ──────────────────────────────────────────────────

const markContactedDialog = ref(false)
const mcType = ref('call')
const mcNote = ref('')
const mcDuration = ref(null)
const mcNextDate = ref('')
const mcSkip = ref(false)
const mcSaving = ref(false)

watch(markContactedDialog, (open) => {
  if (!open) return
  // Prefill from the customer's preferred channel where it makes sense
  const ch = (editable.value.channel || 'Call').toLowerCase()
  mcType.value = ['call', 'email', 'sms'].includes(ch) ? ch : 'call'
  mcNote.value = ''
  mcDuration.value = null
  mcSkip.value = false
  if (editable.value.category) {
    const next = new Date()
    next.setMonth(next.getMonth() + cadenceMonths(editable.value.category))
    mcNextDate.value = next.toISOString().slice(0, 16)
  } else {
    mcNextDate.value = ''
  }
})

function mcApplyDefault() {
  const next = new Date()
  next.setMonth(next.getMonth() + cadenceMonths(editable.value.category))
  mcNextDate.value = next.toISOString().slice(0, 16)
  mcSkip.value = false
}

const mcCanConfirm = computed(() => !!mcNote.value.trim() && !mcSaving.value)

async function confirmMarkContacted() {
  if (!mcCanConfirm.value) return
  // Validate before sending
  const note = mcNote.value.trim()
  const durationMinutes = mcType.value === 'call' ? mcDuration.value : null
  const errs = validateFeedback({ note, type: mcType.value, durationMinutes })
  if (errs) {
    notifyError(errs.note ?? errs.durationMinutes ?? errs.type ?? 'Invalid input')
    return
  }
  mcSaving.value = true
  const now = new Date().toISOString()
  const nextIso = mcSkip.value || !mcNextDate.value ? null : new Date(mcNextDate.value).toISOString()
  try {
    await store.logContact(id, {
      lastContactedIso: now,
      nextContactIso: nextIso,
      type: mcType.value,
      note,
      durationMinutes,
    })
    editable.value.lastContactedAt = now
    editable.value.nextContactAt = nextIso
    markContactedDialog.value = false
    notifySuccess('Logged')
  } catch (e) {
    notifyFromError(e, 'Failed to log')
  } finally {
    mcSaving.value = false
  }
}

// ── Feedback ────────────────────────────────────────────────────────────────

const feedbackEntries = computed(() => store.feedback[id] ?? [])
const newFeedback = ref('')
const quickType = ref('note')
const addingFeedback = ref(false)
const filterType = ref('all')

const firstFeedbackDate = computed(() => {
  const entries = feedbackEntries.value
  if (!entries.length) return null
  const oldest = entries[entries.length - 1]
  return new Date(oldest.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
})

const feedbackCounts = computed(() => {
  const counts = { all: feedbackEntries.value.length, call: 0, email: 0, sms: 0, telegram: 0, note: 0 }
  for (const e of feedbackEntries.value) {
    const t = e.type ?? 'note'
    counts[t] = (counts[t] ?? 0) + 1
  }
  return counts
})

const filterOptions = computed(() => [
  { value: 'all',      label: 'All',       count: feedbackCounts.value.all      },
  { value: 'call',     label: 'Calls',     count: feedbackCounts.value.call     },
  { value: 'email',    label: 'Emails',    count: feedbackCounts.value.email    },
  { value: 'sms',      label: 'SMS',       count: feedbackCounts.value.sms      },
  { value: 'telegram', label: 'Telegram',  count: feedbackCounts.value.telegram },
  { value: 'note',     label: 'Notes',     count: feedbackCounts.value.note     },
])

const filteredFeedback = computed(() => {
  if (filterType.value === 'all') return feedbackEntries.value
  return feedbackEntries.value.filter((e) => (e.type ?? 'note') === filterType.value)
})

onMounted(() => {
  store.fetchFeedback(id)
  store.fetchPropertyInterests(id)
  assessmentStore.fetchForCustomer(id)
})

// ── Tab state ───────────────────────────────────────────────────────────────

function useMediaQuery(query) {
  const matches = ref(false)
  let mql = null
  function update() { matches.value = mql?.matches ?? false }
  onMounted(() => {
    mql = window.matchMedia(query)
    matches.value = mql.matches
    mql.addEventListener('change', update)
  })
  onUnmounted(() => mql?.removeEventListener('change', update))
  return matches
}
const isCompact = useMediaQuery('(max-width: 1100px)')

const activeTab = ref(isCompact.value ? 'profile' : 'interactions')
watch(isCompact, (compact) => {
  if (!compact && activeTab.value === 'profile') activeTab.value = 'interactions'
})

const interestsPanel = ref(null)
const totalInterests = computed(() => store.propertyInterests[id]?.length ?? 0)

function onMatchProperty() {
  interestsPanel.value?.openAdd()
}

async function addFeedback() {
  const note = newFeedback.value.trim()
  if (!note || !customerFound.value) return
  // Length safety net before send
  const errs = validateFeedback({ note, type: quickType.value, durationMinutes: null })
  if (errs) {
    notifyError(errs.note ?? errs.type ?? 'Invalid input')
    return
  }
  addingFeedback.value = true
  try {
    await store.addFeedback(id, { note, type: quickType.value })
    newFeedback.value = ''
    quickType.value = 'note'
  } catch (e) {
    notifyFromError(e, 'Failed to log activity')
  } finally {
    addingFeedback.value = false
  }
}

// ── Telegram enrollment ─────────────────────────────────────────────────────

const copied = ref(false)
async function copyEnrollment() {
  const text = `/start ${editable.value.telegramEnrollmentToken}`
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    // ignore
  }
}
</script>

<style scoped>
.cd-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 28px 40px;
}

/* ── Breadcrumb ──────────────────────────────────────── */
.cd-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text-muted);
}
.cd-breadcrumb__home {
  color: var(--text-muted);
  text-decoration: none;
  transition: color .12s;
}
.cd-breadcrumb__home:hover { color: var(--text); }
.cd-breadcrumb__name {
  color: var(--text);
  font-weight: 550;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Card base ───────────────────────────────────────── */
.cd-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-sm);
}
.cd-card--pad { padding: 24px; }
.cd-card--pad-sm { padding: 20px; }

/* ── Hero ────────────────────────────────────────────── */
.cd-hero {
  padding: 22px 24px;
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
}
.cd-hero__main {
  display: flex;
  gap: 18px;
  align-items: center;
  min-width: 0;
  flex: 1;
}
.cd-hero__avatar {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  font-size: 20px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
  background: var(--surface-sunk);
  color: var(--text);
}
.cd-hero__avatar[data-tone='accent'] { background: color-mix(in oklch, var(--accent) 18%, var(--surface)); color: var(--accent-ink, var(--accent)); }
.cd-hero__avatar[data-tone='warm']   { background: color-mix(in oklch, var(--warm)   18%, var(--surface)); color: var(--warm); }
.cd-hero__avatar[data-tone='hot']    { background: color-mix(in oklch, var(--hot)    18%, var(--surface)); color: var(--hot); }
.cd-hero__avatar[data-tone='cold']   { background: color-mix(in oklch, var(--cold)   18%, var(--surface)); color: var(--cold); }
.cd-hero__id {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.cd-hero__name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.cd-hero__name {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text);
}
.cd-hero__assess-btn {
  margin-left: auto;
  text-decoration: none;
  height: 32px;
  padding: 0 12px;
  font-size: 12.5px;
}
@media (max-width: 720px) {
  .cd-hero__assess-btn {
    margin-left: 0;
    width: 100%;
    justify-content: center;
  }
}
.cd-hero__contact {
  display: flex;
  gap: 16px;
  margin-top: 2px;
  flex-wrap: wrap;
}
.cd-hero__contact-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 13px;
}

.cd-hero__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, auto));
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface-2);
  flex-shrink: 0;
}
.cd-hero__stat {
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.cd-hero__stat + .cd-hero__stat { border-left: 1px solid var(--border); }
.cd-hero__stat-eyebrow {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-faint);
}
.cd-hero__stat-v {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text);
}
.cd-hero__stat-v[data-tone='overdue'] { color: var(--hot); }
.cd-hero__stat-v[data-tone='today']   { color: var(--accent); }
.cd-hero__stat-s {
  font-size: 11.5px;
  color: var(--text-muted);
}
.cd-hero__stat-s[data-tone='overdue'] { color: var(--hot); }

/* ── Body grid ──────────────────────────────────────── */
.cd-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 20px;
}
.cd-body__main {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}
.cd-body__aside {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

/* ── Section title ──────────────────────────────────── */
.cd-sec-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.cd-sec-title h3 {
  margin: 0;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text);
}
.cd-sec-title__sub {
  font-size: 12px;
  color: var(--text-faint);
}

/* ── Form grid ──────────────────────────────────────── */
.cd-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.cd-form-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  grid-column: 1 / -1;
}
.cd-form-notes { margin-top: 18px; }
.cd-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

/* Soft duplicate warning (name) — yellow, allows save */
.cd-dup-warn {
  margin: 4px 0 0;
  padding: 6px 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: oklch(45% 0.13 75);
  background: oklch(96% 0.04 75);
  border: 1px solid oklch(80% 0.10 75);
  border-radius: var(--r-md);
}
:root[data-theme="dark"] .cd-dup-warn {
  background: oklch(28% 0.06 75);
  border-color: oklch(40% 0.10 75);
  color: oklch(85% 0.10 75);
}

/* Hard duplicate error (phone / email) — red, blocks save */
.cd-dup-error {
  margin: 4px 0 0;
  padding: 6px 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--danger, oklch(45% 0.18 27));
  background: oklch(96% 0.03 27);
  border: 1px solid oklch(80% 0.10 27);
  border-radius: var(--r-md);
}
:root[data-theme="dark"] .cd-dup-error {
  background: oklch(28% 0.06 27);
  border-color: oklch(40% 0.10 27);
  color: oklch(85% 0.10 27);
}

.cd-dup-link {
  color: inherit;
  text-decoration: underline;
  font-weight: 600;
}
.cd-dup-link:hover { opacity: 0.85; }

/* Danger zone — delete-customer affordance, kept far from primary actions */
.cd-danger-zone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
  padding: 14px 16px;
  border: 1px dashed oklch(80% 0.10 27);
  border-radius: var(--r-md);
  background: oklch(98% 0.015 27);
}
:root[data-theme="dark"] .cd-danger-zone {
  background: oklch(24% 0.04 27);
  border-color: oklch(40% 0.10 27);
}
.cd-danger-zone__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.cd-danger-zone__text strong {
  font-size: 13.5px;
  color: var(--text);
}
.cd-danger-zone__text span {
  font-size: 12px;
  color: var(--text-muted);
}
.cd-btn-danger {
  background: var(--danger, oklch(56% 0.20 27));
  color: oklch(100% 0 0);
  border: none;
  flex-shrink: 0;
}
.cd-btn-danger:hover:not(:disabled) {
  background: oklch(50% 0.20 27);
}
@media (max-width: 600px) {
  .cd-danger-zone {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  .cd-btn-danger { justify-content: center; }
}

/* ── Quick add ──────────────────────────────────────── */
.cd-quickadd {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}
.cd-quickadd .textarea {
  background: var(--surface);
  min-height: 64px;
}
.cd-quickadd__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

/* ── Type picker (used inline + in dialog) ─────────── */
.cd-typepick {
  display: inline-flex;
  gap: 4px;
  flex-wrap: wrap;
}
.cd-typepick__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 12.5px;
  font-weight: 550;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  cursor: pointer;
  font-family: inherit;
  transition: background .12s, color .12s, border-color .12s;
}
.cd-typepick__btn:hover { color: var(--text); border-color: var(--border-strong); }
.cd-typepick__btn[aria-pressed='true'] {
  background: var(--surface);
  color: var(--text);
  border-color: var(--text);
}
.cd-typepick__btn[aria-pressed='true'][data-tone='call']     { color: var(--accent);  border-color: var(--accent);  background: color-mix(in oklch, var(--accent)  12%, var(--surface)); }
.cd-typepick__btn[aria-pressed='true'][data-tone='email']    { color: var(--cold);    border-color: var(--cold);    background: color-mix(in oklch, var(--cold)    12%, var(--surface)); }
.cd-typepick__btn[aria-pressed='true'][data-tone='sms']      { color: var(--warm);    border-color: var(--warm);    background: color-mix(in oklch, var(--warm)    12%, var(--surface)); }
.cd-typepick__btn[aria-pressed='true'][data-tone='telegram'] { color: var(--success); border-color: var(--success); background: color-mix(in oklch, var(--success) 12%, var(--surface)); }
.cd-typepick__btn[aria-pressed='true'][data-tone='note']     { color: var(--text);    border-color: var(--text);    background: var(--surface-sunk); }

/* ── Filter tabs ────────────────────────────────────── */
.cd-filters {
  display: flex;
  gap: 4px;
  margin-bottom: 18px;
  padding: 4px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  flex-wrap: wrap;
}
.cd-filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12.5px;
  font-weight: 550;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: calc(var(--r-md) - 2px);
  cursor: pointer;
  font-family: inherit;
  transition: background .12s, color .12s, border-color .12s;
}
.cd-filter-tab:hover { color: var(--text); }
.cd-filter-tab[aria-pressed='true'] {
  background: var(--surface);
  color: var(--text);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}
.cd-filter-tab__count {
  font-size: 11px;
  color: var(--text-faint);
  font-weight: 500;
}
.cd-filter-tab[aria-pressed='true'] .cd-filter-tab__count { color: var(--text-muted); }

/* ── Timeline ───────────────────────────────────────── */
.cd-timeline {
  position: relative;
  padding-left: 26px;
}
.cd-timeline::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 8px;
  bottom: 8px;
  width: 1px;
  background: var(--border);
}
.cd-timeline__entry {
  position: relative;
  display: flex;
  gap: 14px;
  padding-bottom: 18px;
}
.cd-timeline__entry:last-child { padding-bottom: 0; }
.cd-timeline__bullet {
  position: absolute;
  left: -26px;
  top: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface);
  border: 1.5px solid var(--text-muted);
  color: var(--text-muted);
  display: grid;
  place-items: center;
}
.cd-timeline__bullet[data-tone='call']     { border-color: var(--accent);  color: var(--accent);  }
.cd-timeline__bullet[data-tone='email']    { border-color: var(--cold);    color: var(--cold);    }
.cd-timeline__bullet[data-tone='sms']      { border-color: var(--warm);    color: var(--warm);    }
.cd-timeline__bullet[data-tone='telegram'] { border-color: var(--success); color: var(--success); }
.cd-timeline__bullet[data-tone='note']     { border-color: var(--text-muted); color: var(--text-muted); }
.cd-timeline__content { flex: 1; min-width: 0; }
.cd-timeline__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.cd-timeline__type {
  font-weight: 600;
  font-size: 13.5px;
  color: var(--text);
}
.cd-timeline__duration {
  font-size: 12px;
  color: var(--text-faint);
}
.cd-timeline__when {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: auto;
}
.cd-timeline__body {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: var(--text);
  line-height: 1.55;
  white-space: pre-wrap;
}
.cd-timeline-empty {
  padding: 32px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px dashed var(--border);
  border-radius: var(--r-md);
}

/* ── Follow-up sidebar ──────────────────────────────── */
.cd-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}
.cd-chips__clear {
  color: var(--text-muted);
}
.cd-mark-btn {
  width: 100%;
  height: 42px;
  margin-top: 16px;
}

/* ── Telegram ───────────────────────────────────────── */
.cd-telegram__hint {
  font-size: 12.5px;
  color: var(--text-muted);
  margin: 0 0 12px;
  line-height: 1.5;
}
.cd-telegram__token {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px 8px 12px;
  background: var(--surface-sunk);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}
.cd-telegram__token code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  color: var(--text);
  word-break: break-all;
}

/* ── Log activity dialog ────────────────────────────── */
.cd-mc-skip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-muted);
  cursor: pointer;
}
.cd-mc-skip input { accent-color: var(--accent); }
.cd-mc-duration .input { max-width: 160px; }
.cd-mc-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}
.cd-mc-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cd-mc-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.cd-mc-section__head h4 {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-faint);
}
.cd-mc-default { align-self: flex-start; }

/* ── Tabbed card (Interactions + Interested properties) ── */
.cd-tab-card { overflow: hidden; }
.cd-tab-body { padding: 22px 24px; }
.cd-tab-subhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.cd-tab-subhead__meta {
  font-size: 12px;
  color: var(--text-muted);
}

/* ── Profile tab sections (compact / iPad / iPhone layout) ── */
.cd-profile-section + .cd-profile-section {
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px solid var(--border);
}
.cd-profile-actions { padding-top: 14px; margin-top: 14px; }

/* When the Buying-profile card lands inside a cd-profile-section (compact
   Profile tab), the section already provides spacing + separator — strip
   the card chrome so it matches the other inline sections (Basic info,
   Follow-up, Telegram) instead of looking like a nested card. */
.cd-profile-section :deep(.bp-card) {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}

/* ── Breakpoints ────────────────────────────────────── */
@media (max-width: 1100px) {
  .cd-shell { padding: 20px 20px 32px; gap: 16px; }
  .cd-body { grid-template-columns: 1fr; }
  .cd-hero { flex-direction: column; align-items: flex-start; gap: 18px; }
  .cd-hero__stats {
    width: 100%;
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 720px) {
  .cd-shell { padding: 14px 12px 24px; gap: 14px; }
  .cd-card--pad { padding: 18px 16px; }
  .cd-card--pad-sm { padding: 16px; }
  .cd-hero { padding: 18px 16px; }
  .cd-hero__name { font-size: 20px; }
  .cd-form-grid,
  .cd-form-pair { grid-template-columns: 1fr; }
  .cd-card__actions { flex-direction: column-reverse; }
  .cd-card__actions .btn { width: 100%; justify-content: center; }
  .cd-tab-body { padding: 18px 16px; }
}
@media (max-width: 480px) {
  .cd-hero__stats { grid-template-columns: 1fr; }
  .cd-hero__stat + .cd-hero__stat {
    border-left: none;
    border-top: 1px solid var(--border);
  }
}
</style>
