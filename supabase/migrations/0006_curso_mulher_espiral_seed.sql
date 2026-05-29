-- Seed do método Mulher Espiral — 8 módulos / 32 aulas com descrições
-- humanas. O conteúdo das aulas (vídeo/texto real) é completado depois
-- via /admin/products. Idempotente: usa WHERE NOT EXISTS pelo título.
do $$
declare
  pid uuid;
  mid uuid;
begin
  select id into pid from public.products where slug = 'mulher-espiral' limit 1;
  if pid is null then
    raise notice 'produto mulher-espiral não encontrado — pulando seed';
    return;
  end if;

  -- Helper para idempotência: insere módulo só se ainda não existir.
  -- Cada bloco abaixo cria um módulo e suas aulas em sequência.

  -- ── Módulo 1
  if not exists (select 1 from public.modules where product_id = pid and title = 'O Chamado') then
    insert into public.modules (product_id, title, sort_order)
    values (pid, 'O Chamado', 1) returning id into mid;
    insert into public.lessons (module_id, title, type, content, sort_order, is_free) values
      (mid, 'Boas-vindas — a primeira espiral', 'video', 'Mensagem de abertura da Sunyan: por que você chegou aqui e o que está pedindo pra ser visto.', 1, true),
      (mid, 'Como percorrer esse caminho', 'text', 'Orientações de ritmo, postura interna e um pedido de gentileza com você mesma.', 2, true),
      (mid, 'O caderno da espiral', 'pdf', 'Caderno guia (PDF) para registrar suas espirais ao longo dos 8 módulos.', 3, false),
      (mid, 'Primeiro encontro com o silêncio', 'audio', 'Áudio de 7 minutos para começar a escutar o que vive em você quando o barulho desce.', 4, false);
  end if;

  -- ── Módulo 2
  if not exists (select 1 from public.modules where product_id = pid and title = 'Reconhecer') then
    insert into public.modules (product_id, title, sort_order)
    values (pid, 'Reconhecer', 2) returning id into mid;
    insert into public.lessons (module_id, title, type, content, sort_order, is_free) values
      (mid, 'Os padrões que aprisionam — sem culpa', 'video', 'Por que vemos o mesmo enredo se repetir e como nomeá-lo sem julgamento.', 1, false),
      (mid, 'O mapa das suas repetições', 'text', 'Exercício escrito para mapear três padrões vivos em você hoje.', 2, false),
      (mid, 'Quando reconhecer já é cura', 'video', 'A primeira espiral termina quando você consegue ver o padrão sem se identificar com ele.', 3, false),
      (mid, 'Prática — 21 dias de escuta', 'audio', 'Prática diária guiada de 5 minutos para os próximos 21 dias.', 4, false);
  end if;

  -- ── Módulo 3
  if not exists (select 1 from public.modules where product_id = pid and title = 'O Corpo como Sabedoria') then
    insert into public.modules (product_id, title, sort_order)
    values (pid, 'O Corpo como Sabedoria', 3) returning id into mid;
    insert into public.lessons (module_id, title, type, content, sort_order, is_free) values
      (mid, 'O corpo guarda o que a mente esqueceu', 'video', 'Como tensões crônicas guardam histórias e como começar a escutá-las.', 1, false),
      (mid, 'A descida de 3 minutos', 'audio', 'Prática para descer da cabeça pro peito e do peito pro ventre em qualquer momento do dia.', 2, false),
      (mid, 'Movimento orgânico — não é exercício', 'video', 'Como mover o corpo a partir da escuta, não da imposição.', 3, false),
      (mid, 'O ciclo lunar interno', 'text', 'Mapa das 4 fases do ciclo menstrual e como honrar cada uma.', 4, false);
  end if;

  -- ── Módulo 4
  if not exists (select 1 from public.modules where product_id = pid and title = 'A Sombra Acolhida') then
    insert into public.modules (product_id, title, sort_order)
    values (pid, 'A Sombra Acolhida', 4) returning id into mid;
    insert into public.lessons (module_id, title, type, content, sort_order, is_free) values
      (mid, 'O que rejeitamos governa — até ser acolhido', 'video', 'O conceito de sombra na perspectiva feminina e por que ela é guardiã, não inimiga.', 1, false),
      (mid, 'A carta para a parte que dói', 'text', 'Exercício de escrita guiada para encontrar a sombra com palavras.', 2, false),
      (mid, 'Diálogo interno guiado', 'audio', 'Prática de visualização para sentar com a sombra e ouvir o que ela quer.', 3, false),
      (mid, 'Integrar é diferente de superar', 'video', 'A diferença que muda tudo: integrar mantém o ouro da sombra; superar perde.', 4, false);
  end if;

  -- ── Módulo 5
  if not exists (select 1 from public.modules where product_id = pid and title = 'O Feminino Sagrado') then
    insert into public.modules (product_id, title, sort_order)
    values (pid, 'O Feminino Sagrado', 5) returning id into mid;
    insert into public.lessons (module_id, title, type, content, sort_order, is_free) values
      (mid, 'Os 6 arquétipos vivos em você', 'video', 'Mística, Guerreira, Mãe-Terra, Amante, Sábia, Selvagem — como reconhecer cada uma.', 1, false),
      (mid, 'A roda dos arquétipos', 'pdf', 'Mapa visual dos 6 arquétipos e suas dinâmicas internas.', 2, false),
      (mid, 'Ritual de altar interior', 'audio', 'Prática para criar um altar interno onde cada arquétipo tem espaço de existir.', 3, false),
      (mid, 'O sagrado no cotidiano', 'video', 'Como o feminino sagrado se manifesta na louça, no banho, no abraço — não só no ritual.', 4, false);
  end if;

  -- ── Módulo 6
  if not exists (select 1 from public.modules where product_id = pid and title = 'Vínculos que Curam') then
    insert into public.modules (product_id, title, sort_order)
    values (pid, 'Vínculos que Curam', 6) returning id into mid;
    insert into public.lessons (module_id, title, type, content, sort_order, is_free) values
      (mid, 'O eco da mãe', 'video', 'A primeira matriz: como o vínculo com a mãe ecoa em todos os vínculos depois.', 1, false),
      (mid, 'Curar a linhagem feminina', 'text', 'Prática guiada de honra às mulheres da sua linhagem — vivas e mortas.', 2, false),
      (mid, 'O que é parceria real', 'video', 'O que muda quando você se relaciona a partir da inteireza, não da falta.', 3, false),
      (mid, 'Círculos de mulheres — por que importam', 'audio', 'Conversa sobre a tecnologia milenar do círculo e como ele cura sem terapia.', 4, false);
  end if;

  -- ── Módulo 7
  if not exists (select 1 from public.modules where product_id = pid and title = 'A Voz Própria') then
    insert into public.modules (product_id, title, sort_order)
    values (pid, 'A Voz Própria', 7) returning id into mid;
    insert into public.lessons (module_id, title, type, content, sort_order, is_free) values
      (mid, 'Quando a voz dorme — e como acordá-la', 'video', 'Sinais de garganta fechada e como liberar com gentileza.', 1, false),
      (mid, 'O sim e o não que custam caro', 'text', 'A diferença entre dizer sim por medo e dizer sim por escolha real.', 2, false),
      (mid, 'A escrita libertadora', 'video', 'Prática de escrita automática para ouvir a voz que você ainda não conhece.', 3, false),
      (mid, 'A coragem feminina de existir', 'audio', 'Conversa sobre presença, autoridade interna e ocupar o próprio espaço.', 4, false);
  end if;

  -- ── Módulo 8
  if not exists (select 1 from public.modules where product_id = pid and title = 'A Espiral Continua') then
    insert into public.modules (product_id, title, sort_order)
    values (pid, 'A Espiral Continua', 8) returning id into mid;
    insert into public.lessons (module_id, title, type, content, sort_order, is_free) values
      (mid, 'O que muda quando você integra', 'video', 'Síntese de tudo que foi atravessado e como se manifesta na vida prática.', 1, false),
      (mid, 'O ritual de fechamento', 'audio', 'Prática para selar o ciclo e honrar a mulher que você se tornou.', 2, false),
      (mid, 'A próxima espiral — e a próxima', 'video', 'Por que cura não é destino, é orientação. Como continuar sozinha (e em comunidade).', 3, false),
      (mid, 'Sua certificação', 'text', 'Detalhes sobre o certificado de conclusão e como compartilhar (se quiser).', 4, false);
  end if;
end $$;
