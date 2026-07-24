/* =============================================
   SPORT ACADEMIA — script.js
   Mobile First · WCAG 2.2 AA
   Autor: Dev Sênior
============================================= */

'use strict';

/* =============================================
   UTILITÁRIOS GLOBAIS
============================================= */

/** Atalhos de query */
const qs = (s, ctx = document) => ctx.querySelector(s);
const qsa = (s, ctx = document) => [...ctx.querySelectorAll(s)];

/** Debounce — evita execuções excessivas em scroll/resize */
function debounce(fn, ms = 100) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/** Feature detection — verifica suporte antes de usar API */
const suporta = {
    localStorage: (() => { try { localStorage.setItem('_t', '1'); localStorage.removeItem('_t'); return true; } catch { return false; } })(),
    intersectionObserver: 'IntersectionObserver' in window,
    matchMedia: 'matchMedia' in window,
};

/* =============================================
   1. PRELOADER
   Remove o spinner quando a página carrega
============================================= */
window.addEventListener('load', () => {
    try {
        const pre = qs('#preloader');
        if (!pre) return;
        pre.classList.add('is-hidden');
        // Remove do DOM após transição para não bloquear interações
        pre.addEventListener('transitionend', () => pre.remove(), { once: true });
    } catch (e) {
        console.error('[Preloader]', e);
    }
});

/* =============================================
   2. TOAST — notificação reutilizável
============================================= */
let _toastTimer = null;

/**
 * Exibe uma mensagem de toast.
 * @param {string} msg  — Texto da mensagem
 * @param {'sucesso'|'erro'|''} tipo — Estilo visual
 * @param {number} duracao — Milissegundos de exibição
 */
function exibirToast(msg, tipo = '', duracao = 4000) {
    try {
        const toast = qs('#toast');
        const toastMsg = qs('#toast-msg');
        if (!toast || !toastMsg) return;

        toastMsg.textContent = msg;
        toast.hidden = false;
        toast.className = `toast${tipo ? ' toast--' + tipo : ''}`;

        // Anuncia ao leitor de tela via aria-live
        toast.setAttribute('aria-live', tipo === 'erro' ? 'assertive' : 'polite');

        clearTimeout(_toastTimer);
        _toastTimer = setTimeout(() => ocultarToast(), duracao);
    } catch (e) {
        console.error('[Toast]', e);
    }
}

/** Oculta o toast atual */
function ocultarToast() {
    const toast = qs('#toast');
    if (toast) toast.hidden = true;
}

// Expõe globalmente para uso inline
window.exibirToast = exibirToast;
window.ocultarToast = ocultarToast;

/* =============================================
   3. COOKIE BANNER — LGPD
   Persiste escolha no localStorage
============================================= */
(function initCookieBanner() {
    if (!suporta.localStorage) return;
    try {
        const banner = qs('#cookie-banner');
        const btnAcept = qs('#cookie-accept');
        const btnRej = qs('#cookie-reject');
        if (!banner) return;

        // Só exibe se ainda não houve escolha
        if (!localStorage.getItem('cookie_consent')) {
            banner.hidden = false;
        }

        function registrarEscolha(valor) {
            localStorage.setItem('cookie_consent', valor);
            banner.hidden = true;
        }

        btnAcept?.addEventListener('click', () => registrarEscolha('accepted'));
        btnRej?.addEventListener('click', () => registrarEscolha('rejected'));

    } catch (e) {
        console.error('[CookieBanner]', e);
    }
})();

/* =============================================
   4. TEMA CLARO / ESCURO
   Persistido em localStorage; respeita prefers-color-scheme
============================================= */
(function initTema() {
    try {
        const btn = qs('#theme-toggle');
        const icon = qs('#theme-icon');
        const html = document.documentElement;

        // Determina tema inicial: localStorage > prefers-color-scheme > dark
        function temaInicial() {
            if (suporta.localStorage) {
                const salvo = localStorage.getItem('tema');
                if (salvo) return salvo;
            }
            if (suporta.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                return 'light';
            }
            return 'dark';
        }

        // Aplica tema e atualiza botão
        function aplicarTema(tema) {
            html.setAttribute('data-theme', tema);
            if (icon) {
                icon.className = tema === 'dark'
                    ? 'fa-solid fa-sun'
                    : 'fa-solid fa-moon';
            }
            if (btn) {
                btn.setAttribute('aria-label',
                    tema === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'
                );
            }
            if (suporta.localStorage) {
                localStorage.setItem('tema', tema);
            }
        }

        aplicarTema(temaInicial());

        // Toggle ao clicar
        btn?.addEventListener('click', () => {
            const atual = html.getAttribute('data-theme') || 'dark';
            aplicarTema(atual === 'dark' ? 'light' : 'dark');
        });

        // Escuta mudança no sistema operacional
        suporta.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', (e) => {
                if (!suporta.localStorage || !localStorage.getItem('tema')) {
                    aplicarTema(e.matches ? 'dark' : 'light');
                }
            });

    } catch (e) {
        console.error('[Tema]', e);
    }
})();

/* =============================================
   5. NAVBAR — scroll, active link, hamburger
============================================= */
(function initNavbar() {
    try {
        const navbar = qs('#navbar');
        const hamburger = qs('#navbar-hamburger, #hamburger');
        const mobileMenu = qs('#mobile-menu');
        const links = qsa('.navbar__link');

        if (!navbar) return;

        /* --- Sombra ao rolar + active link --- */
        const secoes = ['hero', 'sobre', 'servicos', 'equipe', 'galeria', 'depoimentos', 'agendamento', 'contato'];

        const onScroll = debounce(() => {
            /* Sombra na navbar */
            navbar.classList.toggle('is-scrolled', window.scrollY > 50);

            /* Active link — destaca o link da seção visível */
            const navH = navbar.offsetHeight;
            let atual = '';

            secoes.forEach(id => {
                const el = qs('#' + id);
                if (el && window.scrollY >= el.offsetTop - navH - 20) {
                    atual = id;
                }
            });

            links.forEach(a => {
                const href = a.getAttribute('href');
                const ativo = href === '#' + atual;
                a.classList.toggle('is-active', ativo);
                ativo
                    ? a.setAttribute('aria-current', 'page')
                    : a.removeAttribute('aria-current');
            });
        }, 80);

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); /* executa uma vez no load */

        /* --- Hamburger: abre / fecha menu mobile --- */
        function abrirMenu() {
            if (!mobileMenu || !hamburger) return;
            mobileMenu.hidden = false;
            hamburger.setAttribute('aria-expanded', 'true');
            hamburger.setAttribute('aria-label', 'Fechar menu');
            /* Foco no primeiro link para acessibilidade */
            qs('.mobile-menu__link', mobileMenu)?.focus();
        }

        function fecharMenu() {
            if (!mobileMenu || !hamburger) return;
            mobileMenu.hidden = true;
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.setAttribute('aria-label', 'Abrir menu');
        }

        function toggleMenu() {
            mobileMenu?.hidden ? abrirMenu() : fecharMenu();
        }

        hamburger?.addEventListener('click', toggleMenu);

        /* Fecha ao clicar em qualquer link do menu mobile */
        qsa('.mobile-menu__link, .mobile-menu__cta').forEach(link => {
            link.addEventListener('click', fecharMenu);
        });

        /* Fecha com ESC */
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu && !mobileMenu.hidden) {
                fecharMenu();
                hamburger?.focus(); /* devolve foco ao botão */
            }
        });

        /* Fecha ao clicar fora do menu (toque / clique) */
        document.addEventListener('click', (e) => {
            if (
                mobileMenu &&
                !mobileMenu.hidden &&
                !mobileMenu.contains(e.target) &&
                !hamburger?.contains(e.target)
            ) {
                fecharMenu();
            }
        });

        /* Garante que o menu mobile some em ≥768px
           (caso o usuário redimensione a janela com o menu aberto) */
        if (suporta.matchMedia) {
            const mq = window.matchMedia('(min-width: 768px)');
            const onResize = (e) => { if (e.matches) fecharMenu(); };
            /* addEventListener com objeto é mais seguro para compatibilidade */
            try { mq.addEventListener('change', onResize); }
            catch (_) { mq.addListener(onResize); } /* fallback Safari antigo */
        }

    } catch (e) {
        console.error('[Navbar]', e);
    }
})();

/* =============================================
   6. LIGHTBOX — galeria
   role="dialog" · aria-modal · foco gerenciado
============================================= */
(function initLightbox() {
    try {
        const lb = qs('#lightbox');
        const lbImg = qs('#lightbox-img');
        const lbCaption = qs('#lightbox-caption');
        const lbClose = qs('.lightbox__close');
        if (!lb) return;

        let origemFoco = null; // elemento que tinha foco antes de abrir

        /** Abre o lightbox */
        function abrirLightbox(src, caption = '') {
            origemFoco = document.activeElement;
            if (lbImg) { lbImg.src = src; lbImg.alt = caption; }
            if (lbCaption) lbCaption.textContent = caption;
            lb.hidden = false;
            document.body.style.overflow = 'hidden';
            lbClose?.focus(); // move foco para o botão fechar
        }

        /** Fecha o lightbox */
        function fecharLightbox() {
            lb.hidden = true;
            if (lbImg) lbImg.src = '';
            document.body.style.overflow = '';
            origemFoco?.focus(); // restaura foco original
        }

        // Trap de foco dentro do lightbox
        lb.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { fecharLightbox(); return; }
            if (e.key !== 'Tab') return;
            const focaveis = qsa('button,[href],[tabindex]:not([tabindex="-1"])', lb);
            if (!focaveis.length) return;
            const first = focaveis[0], last = focaveis[focaveis.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        });

        // Expõe globalmente para onclick inline no HTML
        window.abrirLightbox = abrirLightbox;
        window.fecharLightbox = fecharLightbox;

    } catch (e) {
        console.error('[Lightbox]', e);
    }
})();

/* =============================================
   7. CARROSSEL DE DEPOIMENTOS
   Acessível · autoplay pausável · teclado
============================================= */
(function initCarrossel() {
    try {
        const track = qs('#carrossel-track');
        const dotsWrap = qs('#carrossel-dots');
        if (!track) return;

        const slides = qsa('.carrossel__slide', track);
        const total = slides.length;
        let atual = 0;
        let timer = null;
        const DURACAO = 5500;

        // — Cria dots de navegação —
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'carrossel__dot';
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `Ir para depoimento ${i + 1}`);
            dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
            dot.addEventListener('click', () => { irPara(i); reiniciarTimer(); });
            dotsWrap?.appendChild(dot);
        });
        const dots = qsa('.carrossel__dot', dotsWrap);

        /** Vai para slide de índice específico */
        function irPara(idx) {
            // Índice circular
            atual = ((idx % total) + total) % total;
            track.style.transform = `translateX(-${atual * 100}%)`;
            slides.forEach((sl, i) => {
                const ativo = i === atual;
                sl.setAttribute('aria-current', ativo ? 'true' : 'false');
                sl.setAttribute('aria-hidden', ativo ? 'false' : 'true');
            });
            dots.forEach((d, i) => {
                const ativo = i === atual;
                d.classList.toggle('is-active', ativo);
                d.setAttribute('aria-selected', String(ativo));
            });
        }

        /** Move N posições (+1 próximo / -1 anterior) */
        function moverSlide(direcao) {
            irPara(atual + direcao);
            reiniciarTimer();
        }
        window.moverSlide = moverSlide; // expõe para onclick inline

        // — Autoplay —
        function iniciarTimer() {
            timer = setInterval(() => irPara(atual + 1), DURACAO);
        }
        function pararTimer() { clearInterval(timer); timer = null; }
        function reiniciarTimer() { pararTimer(); iniciarTimer(); }

        // Respeita prefers-reduced-motion — não inicia autoplay
        const reduzido = suporta.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduzido) iniciarTimer();

        // Pausa ao hover e foco (acessibilidade)
        const carrossel = qs('#carrossel');
        carrossel?.addEventListener('mouseenter', pararTimer);
        carrossel?.addEventListener('mouseleave', () => { if (!reduzido) iniciarTimer(); });
        carrossel?.addEventListener('focusin', pararTimer);
        carrossel?.addEventListener('focusout', () => { if (!reduzido) iniciarTimer(); });

        // Setas do teclado
        carrossel?.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') { moverSlide(-1); }
            if (e.key === 'ArrowRight') { moverSlide(1); }
        });

        irPara(0);

    } catch (e) {
        console.error('[Carrossel]', e);
    }
})();

/* =============================================
   8. FORMULÁRIO DE AGENDAMENTO
   Validação · envio via WhatsApp
============================================= */
(function initFormAgendamento() {
    try {
        const form = qs('#form-agendamento');
        if (!form) return;

        // Define data mínima como hoje
        const inputData = qs('#ag-data');
        if (inputData) {
            const hoje = new Date();
            const iso = hoje.toISOString().split('T')[0];
            inputData.min = iso;
        }

        /**
         * Valida um campo e exibe/limpa mensagem de erro.
         * @returns {boolean} true se válido
         */
        function validarCampo(id, erroId) {
            const campo = qs('#' + id);
            const erroEl = qs('#' + erroId);
            if (!campo || !erroEl) return true;

            let msg = '';
            if (campo.validity.valueMissing) {
                msg = 'Campo obrigatório.';
            } else if (campo.validity.patternMismatch) {
                msg = campo.dataset.erroPattern || 'Formato inválido.';
            } else if (campo.validity.typeMismatch) {
                msg = 'Valor inválido.';
            } else if (campo.type === 'date') {
                const sel = new Date(campo.value + 'T00:00');
                const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
                if (sel < hoje) msg = 'Escolha uma data futura.';
            }

            erroEl.textContent = msg;
            campo.classList.toggle('is-invalid', !!msg);
            campo.classList.toggle('is-valid', !msg && campo.value !== '');
            return !msg;
        }

        // Validação em tempo real ao perder foco
        const mapaErros = {
            'ag-nome': 'ag-nome-erro',
            'ag-telefone': 'ag-tel-erro',
            'ag-data': 'ag-data-erro',
        };
        Object.entries(mapaErros).forEach(([id, erroId]) => {
            qs('#' + id)?.addEventListener('blur', () => validarCampo(id, erroId));
        });

        // Submit
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            try {
                let valido = true;

                // Valida campos mapeados
                Object.entries(mapaErros).forEach(([id, erroId]) => {
                    if (!validarCampo(id, erroId)) valido = false;
                });

                // Valida selects obrigatórios
                ['ag-periodo', 'ag-objetivo'].forEach(id => {
                    const sel = qs('#' + id);
                    const err = qs('#' + id + '-erro');
                    if (sel && !sel.value) {
                        valido = false;
                        sel.classList.add('is-invalid');
                        if (err) err.textContent = 'Selecione uma opção.';
                    }
                });

                if (!valido) {
                    exibirToast('⚠️ Preencha todos os campos obrigatórios.', 'erro');
                    // Move foco para o primeiro campo com erro
                    qs('.is-invalid', form)?.focus();
                    return;
                }

                // Monta mensagem para o WhatsApp
                const nome = qs('#ag-nome')?.value.trim();
                const telefone = qs('#ag-telefone')?.value.trim();
                const email = qs('#ag-email')?.value.trim();
                const data = qs('#ag-data')?.value;
                const periodo = qs('#ag-periodo')?.value;
                const objetivo = qs('#ag-objetivo')?.value;
                const obs = qs('#ag-obs')?.value.trim();

                const linhas = [
                    '🏋️ *Solicitação de Visita — Sport Academia*',
                    '',
                    `*Nome:* ${nome}`,
                    `*WhatsApp:* ${telefone}`,
                    email ? `*E-mail:* ${email}` : null,
                    `*Data:* ${data}`,
                    `*Período:* ${periodo}`,
                    `*Objetivo:* ${objetivo}`,
                    obs ? `*Observações:* ${obs}` : null,
                ].filter(Boolean).join('\n');

                // BACKEND: substituir pelo número real da academia
                const numero = '5511999999999';
                window.open(
                    `https://wa.me/${numero}?text=${encodeURIComponent(linhas)}`,
                    '_blank', 'noopener,noreferrer'
                );

                exibirToast('✅ Agendamento enviado! Aguarde contato pelo WhatsApp.', 'sucesso');
                form.reset();
                qsa('.is-valid,.is-invalid', form).forEach(el =>
                    el.classList.remove('is-valid', 'is-invalid')
                );

                /* BACKEND REAL (descomentar e adaptar):
                fetch('/api/agendamento', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nome, telefone, email, data, periodo, objetivo, obs })
                }).then(r => r.json()).then(d => console.log(d));
                */

            } catch (err) {
                console.error('[FormAgendamento submit]', err);
                exibirToast('Erro ao enviar. Tente novamente.', 'erro');
            }
        });

    } catch (e) {
        console.error('[FormAgendamento]', e);
    }
})();

/* =============================================
   9. FORMULÁRIO DE NEWSLETTER
============================================= */
(function initNewsletter() {
    try {
        const form = qs('#form-newsletter');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            try {
                const input = qs('#nl-email');
                const erro = qs('#nl-erro');

                if (!input?.value || !input.validity.valid) {
                    input?.classList.add('is-invalid');
                    if (erro) erro.textContent = 'Informe um e-mail válido.';
                    input?.focus();
                    return;
                }

                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
                if (erro) erro.textContent = '';

                // BACKEND: enviar e-mail para API de newsletter / CRM
                // fetch('/api/newsletter', { method:'POST', body: JSON.stringify({ email: input.value }) })

                exibirToast('📧 Inscrito com sucesso! Boas vindas.', 'sucesso');
                form.reset();
                input.classList.remove('is-valid');

            } catch (err) {
                console.error('[Newsletter submit]', err);
                exibirToast('Erro ao assinar. Tente novamente.', 'erro');
            }
        });

    } catch (e) {
        console.error('[Newsletter]', e);
    }
})();

/* =============================================
   10. BOTÃO VOLTAR AO TOPO (CORRIGIDO)
   Problema: main.focus() sem preventScroll:true
   fazia o browser rolar de volta ao elemento,
   interrompendo o scrollTo({ top:0 }) no meio.
   Solução: setTimeout + preventScroll:true
============================================= */
(function initBtnTopo() {
    try {
        const btn = qs('#btn-topo');
        if (!btn) return;

        /* Mostra/oculta o botão conforme posição do scroll */
        const onScroll = debounce(() => {
            const visivel = window.scrollY > 400;
            btn.hidden = false;
            btn.classList.toggle('is-visible', visivel);
            btn.setAttribute('aria-hidden', String(!visivel));
        }, 100);

        window.addEventListener('scroll', onScroll, { passive: true });

        /* Ao clicar, rola ao topo e só move o foco DEPOIS que o scroll termina */
        btn.addEventListener('click', () => {

            /* 1. Rola suavemente até o topo */
            window.scrollTo({ top: 0, behavior: 'smooth' });

            /* 2. Aguarda o scroll terminar (~650ms) antes de mover o foco.
                  preventScroll:true impede o browser de rolar de volta
                  ao tentar exibir o elemento focado — era o bug. */
            setTimeout(() => {
                const main = qs('#conteudo-principal');
                if (main) {
                    main.setAttribute('tabindex', '-1');

                    /* preventScroll:true = foca sem acionar rolagem automática */
                    main.focus({ preventScroll: true });
                }
            }, 650);

        });

    } catch (e) {
        console.error('[BtnTopo]', e);
    }
})();

/* =============================================
   11. SCROLL REVEAL — IntersectionObserver
============================================= */
(function initScrollReveal() {
    if (!suporta.intersectionObserver) {
        // Fallback: mostra tudo sem animação
        qsa('.reveal-up,.reveal-left,.reveal-right').forEach(el =>
            el.classList.add('is-visible')
        );
        return;
    }

    // Respeita preferência de movimento reduzido
    const reduzido = suporta.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                if (reduzido) {
                    el.classList.add('is-visible');
                } else {
                    setTimeout(() => el.classList.add('is-visible'), i * 60);
                }
                observer.unobserve(el);
            });
        }, { threshold: 0.12 });

        qsa('.reveal-up,.reveal-left,.reveal-right').forEach(el => observer.observe(el));
        qsa('.card-servico,.card-equipe,.galeria__item,.depoimento-card').forEach(el => {
            el.classList.add('reveal-up');
            observer.observe(el);
        });

    } catch (e) {
        console.error('[ScrollReveal]', e);
        // Fallback
        qsa('.reveal-up,.reveal-left,.reveal-right').forEach(el =>
            el.classList.add('is-visible')
        );
    }
})();

/* =============================================
   12. ANIMAÇÃO HERO — entrada em cascata
============================================= */
(function initHeroAnimation() {
    const reduzido = suporta.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduzido) return;

    try {
        const elementos = [
            '.hero__eyebrow',
            '.hero__title',
            '.hero__desc',
            '.hero__actions',
            '.hero__stats',
        ];

        elementos.forEach((sel, i) => {
            const el = qs(sel);
            if (!el) return;
            el.style.opacity = '0';
            el.style.transform = 'translateY(28px)';
            el.style.transition = `opacity .7s ease ${i * .15}s, transform .7s ease ${i * .15}s`;
        });

        // Aguarda dois frames para garantir que o CSS foi aplicado
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                elementos.forEach(sel => {
                    const el = qs(sel);
                    if (!el) return;
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                });
            });
        });

    } catch (e) {
        console.error('[HeroAnimation]', e);
    }
})();

/* =============================================
   13. SMOOTH SCROLL — âncoras internas
============================================= */
(function initSmoothScroll() {
    document.addEventListener('click', (e) => {
        try {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;
            const href = link.getAttribute('href');
            if (!href || href === '#' || href === '#!') return;
            const alvo = qs(href);
            if (!alvo) return;

            e.preventDefault();
            const navH = qs('#navbar')?.offsetHeight || 0;
            const topo = alvo.getBoundingClientRect().top + window.scrollY - navH - 8;
            window.scrollTo({ top: topo, behavior: 'smooth' });
            history.pushState(null, '', href);

        } catch (err) {
            console.error('[SmoothScroll]', err);
        }
    });
})();

/* =============================================
   14. ANO ATUAL — footer
============================================= */
(function initAnoFooter() {
    const el = qs('#footer-ano');
    if (el) el.textContent = new Date().getFullYear();
})();
