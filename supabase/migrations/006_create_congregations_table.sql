-- Criar tabela de congregações
CREATE TABLE IF NOT EXISTS public.congregations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    region TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.congregations ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: todos podem ler
CREATE POLICY "Congregations are viewable by everyone"
    ON public.congregations
    FOR SELECT
    USING (true);

-- Política para INSERT: apenas autenticados podem inserir (para admins futuramente)
CREATE POLICY "Congregations are insertable by authenticated users"
    ON public.congregations
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE: apenas autenticados podem atualizar
CREATE POLICY "Congregations are updatable by authenticated users"
    ON public.congregations
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Política para DELETE: apenas autenticados podem deletar
CREATE POLICY "Congregations are deletable by authenticated users"
    ON public.congregations
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Inserir dados das congregações
INSERT INTO public.congregations (name, region) VALUES
('ADBA JD. PAULISTA', 'Sul'),
('ADBA VILA MELHADO', 'Sul'),
('ADBA PQ. DAS HORTÊNSIAS I', 'Sul'),
('ADBA PQ. DAS HORTÊNSIAS II', 'Sul'),
('ADBA JD. IEDA', 'Sul'),
('ADBA JD. IMPERIAL', 'Sul'),
('ADBA JD. PORTUGAL', 'Sul'),
('ADBA JD. IGUATEMI', 'Sul'),
('ADBA JD. CRUZEIRO DO SUL', 'Sul'),
('ADBA VALE DO SOL', 'Oeste'),
('ADBA SEDE', 'Oeste'),
('ADBA JD. MARIA LUIZA - AQA', 'Oeste'),
('ADBA SANTA ANGELINA/YAMADA', 'Oeste'),
('ADBA PQ. DAS LARANJEIRAS', 'Oeste'),
('ADBA JD. DO VALLE', 'NORTE'),
('ADBA JD. INDAIÁ', 'NORTE'),
('ADBA JD. ROBERTO SELMI DEY V', 'NORTE'),
('ADBA JD. ROBERTO SELMI DEY III', 'NORTE'),
('ADBA JD. VENEZA', 'NORTE'),
('ADBA V. VERDE', 'NORTE'),
('ADBA JD. AMÉRICA', 'Leste'),
('ADBA ALTOS DO PINHEIROS', 'Leste'),
('ADBA JD ESMERALDA', 'Leste'),
('ADBA JD. EUROPA', 'Leste'),
('ADBA JD. SÃO PAULO', 'Leste'),
('ADBA PQ. RES. SÃO PAULO', 'Leste'),
('ADBA ALAMEDAS', 'Leste'),
('ADBA PQ. GRAMADO', 'Leste'),
('ADBA SANTA LÚCIA', 'Américo e Santa Lúcia'),
('ADBA ACO. NOVA CANAÃ', 'Américo e Santa Lúcia'),
('ADBA ACO. MARIA LUIZA', 'Américo e Santa Lúcia'),
('ADBA ACO. VISTA ALEGRE', 'Américo e Santa Lúcia'),
('ADBA ACO. SADIA', 'Américo e Santa Lúcia'),
('ADBA ACO. SÃO JOSÉ', 'Américo e Santa Lúcia'),
('ADBA ACO. SANTA TEREZINHA', 'Américo e Santa Lúcia'),
('ADBA GUATAPARÁ II', 'Região Guatapará'),
('ADBA MOMBUCA', 'Região Guatapará'),
('ADBA RINCÃO', 'Região Guatapará'),
('ADBA TAQUARAL', 'Região Guatapará')
ON CONFLICT (name) DO NOTHING;

-- Criar índice para melhorar performance nas buscas
CREATE INDEX IF NOT EXISTS idx_congregations_region ON public.congregations(region);
CREATE INDEX IF NOT EXISTS idx_congregations_name ON public.congregations(name);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_congregations_updated_at
    BEFORE UPDATE ON public.congregations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();




