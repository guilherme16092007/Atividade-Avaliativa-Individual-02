import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

// Array para armazenar as ordens em memória
let ordens = [];

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

// Valida o tipo do produto usando lógica equivalente
// a switch + loop de validação
function validarTipoProduto(tipoProduto) {
    const tiposValidos = [1, 2, 3];

    for (let i = 0; i < tiposValidos.length; i++) {
        if (tipoProduto === tiposValidos[i]) {
            switch (tipoProduto) {
                case 1:
                    return true;

                case 2:
                    return true;

                case 3:
                    return true;
            }
        }
    }

    return false;
}

// Calcula o custo unitário ajustado
function calcularCustoUnitarioAjustado(tipoProduto, custoUnitarioBase) {
    switch (tipoProduto) {
        case 1:
            return custoUnitarioBase;

        case 2:
            return custoUnitarioBase * 1.10;

        case 3:
            return custoUnitarioBase * 1.20;

        default:
            return 0;
    }
}

// Calcula o alerta de estoque
function calcularAlertaEstoque(estoqueFinal) {
    if (estoqueFinal > 5000) {
        return "ALTO";
    }

    if (estoqueFinal < 500) {
        return "CRITICO";
    }

    return "NORMAL";
}

// Calcula todos os campos derivados da ordem
function calcularDadosOrdem(ordem) {
    const estoqueFinal =
        ordem.estoqueInicial + ordem.quantidadeProduzida;

    const custoUnitarioAjustado =
        calcularCustoUnitarioAjustado(
            ordem.tipoProduto,
            ordem.custoUnitarioBase
        );

    const custoTotal =
        ordem.quantidadeProduzida * custoUnitarioAjustado;

    const alertaEstoque =
        calcularAlertaEstoque(estoqueFinal);

    return {
        ...ordem,
        estoqueFinal,
        custoUnitarioAjustado,
        custoTotal,
        alertaEstoque
    };
}

// =====================================================
// POST /ordens
// Cadastrar nova ordem
// =====================================================

app.post("/ordens", (req, res) => {
    const {
        codigoOrdem,
        codigoProduto,
        tipoProduto,
        quantidadeProduzida,
        custoUnitarioBase,
        estoqueInicial
    } = req.body;

    // Verificação dos campos obrigatórios
    if (
        codigoOrdem === undefined ||
        codigoProduto === undefined ||
        tipoProduto === undefined ||
        quantidadeProduzida === undefined ||
        custoUnitarioBase === undefined ||
        estoqueInicial === undefined
    ) {
        return res.status(400).json({
            erro: "Todos os campos são obrigatórios."
        });
    }

    // Verifica se o código da ordem já existe
    const ordemExistente = ordens.find(
        ordem => ordem.codigoOrdem === codigoOrdem
    );

    if (ordemExistente) {
        return res.status(400).json({
            erro: "codigoOrdem já está cadastrado."
        });
    }

    // Validação do tipo do produto
    if (!validarTipoProduto(tipoProduto)) {
        return res.status(400).json({
            erro: "tipoProduto deve ser 1, 2 ou 3."
        });
    }

    // Validação dos valores numéricos
    if (
        typeof quantidadeProduzida !== "number" ||
        typeof custoUnitarioBase !== "number" ||
        typeof estoqueInicial !== "number"
    ) {
        return res.status(400).json({
            erro: "quantidadeProduzida, custoUnitarioBase e estoqueInicial devem ser números."
        });
    }

    const novaOrdem = calcularDadosOrdem({
        codigoOrdem,
        codigoProduto,
        tipoProduto,
        quantidadeProduzida,
        custoUnitarioBase,
        estoqueInicial
    });

    ordens.push(novaOrdem);

    return res.status(201).json(novaOrdem);
});

// =====================================================
// GET /ordens
// Listar todas as ordens
// =====================================================

app.get("/ordens", (req, res) => {
    let resultado = [...ordens];

    const { tipo, alerta } = req.query;

    // Filtro por tipo
    if (tipo !== undefined) {
        const tipoNumerico = Number(tipo);

        resultado = resultado.filter(
            ordem => ordem.tipoProduto === tipoNumerico
        );
    }

    // Filtro por alerta
    if (alerta !== undefined) {
        resultado = resultado.filter(
            ordem => ordem.alertaEstoque === alerta.toUpperCase()
        );
    }

    return res.status(200).json(resultado);
});

// =====================================================
// GET /ordens/:codigoOrdem
// Buscar uma ordem específica
// =====================================================

app.get("/ordens/:codigoOrdem", (req, res) => {
    const { codigoOrdem } = req.params;

    const ordem = ordens.find(
        ordem => String(ordem.codigoOrdem) === String(codigoOrdem)
    );

    if (!ordem) {
        return res.status(404).json({
            erro: "Ordem não encontrada."
        });
    }

    return res.status(200).json(ordem);
});

// =====================================================
// PUT /ordens/:codigoOrdem
// Atualizar ordem
// =====================================================

app.put("/ordens/:codigoOrdem", (req, res) => {
    const { codigoOrdem } = req.params;

    const indice = ordens.findIndex(
        ordem => String(ordem.codigoOrdem) === String(codigoOrdem)
    );

    if (indice === -1) {
        return res.status(404).json({
            erro: "Ordem não encontrada."
        });
    }

    const ordemAtual = ordens[indice];

    const {
        codigoProduto,
        tipoProduto,
        quantidadeProduzida,
        custoUnitarioBase,
        estoqueInicial
    } = req.body;

    // Cria uma nova versão da ordem
    const ordemAtualizada = {
        ...ordemAtual,

        codigoProduto:
            codigoProduto !== undefined
                ? codigoProduto
                : ordemAtual.codigoProduto,

        tipoProduto:
            tipoProduto !== undefined
                ? tipoProduto
                : ordemAtual.tipoProduto,

        quantidadeProduzida:
            quantidadeProduzida !== undefined
                ? quantidadeProduzida
                : ordemAtual.quantidadeProduzida,

        custoUnitarioBase:
            custoUnitarioBase !== undefined
                ? custoUnitarioBase
                : ordemAtual.custoUnitarioBase,

        estoqueInicial:
            estoqueInicial !== undefined
                ? estoqueInicial
                : ordemAtual.estoqueInicial
    };

    // Valida tipo caso tenha sido alterado
    if (!validarTipoProduto(ordemAtualizada.tipoProduto)) {
        return res.status(400).json({
            erro: "tipoProduto deve ser 1, 2 ou 3."
        });
    }

    // Valida valores numéricos
    if (
        typeof ordemAtualizada.quantidadeProduzida !== "number" ||
        typeof ordemAtualizada.custoUnitarioBase !== "number" ||
        typeof ordemAtualizada.estoqueInicial !== "number"
    ) {
        return res.status(400).json({
            erro: "quantidadeProduzida, custoUnitarioBase e estoqueInicial devem ser números."
        });
    }

    // Recalcula os campos derivados
    const ordemRecalculada =
        calcularDadosOrdem(ordemAtualizada);

    ordens[indice] = ordemRecalculada;

    return res.status(200).json(ordemRecalculada);
});

// =====================================================
// DELETE /ordens/:codigoOrdem
// Excluir ordem
// =====================================================

app.delete("/ordens/:codigoOrdem", (req, res) => {
    const { codigoOrdem } = req.params;

    const indice = ordens.findIndex(
        ordem => String(ordem.codigoOrdem) === String(codigoOrdem)
    );

    if (indice === -1) {
        return res.status(404).json({
            erro: "Ordem não encontrada."
        });
    }

    ordens.splice(indice, 1);

    return res.status(200).json({
        mensagem: "Ordem removida com sucesso."
    });
});

// =====================================================
// GET /relatorios/ordens
// Relatório consolidado
// =====================================================

app.get("/relatorios/ordens", (req, res) => {

    const totalOrdens = ordens.length;

    // Estoque por tipo
    const estoquePorTipo = {
        padrao: 0,
        premium: 0,
        sobEncomenda: 0
    };

    ordens.forEach(ordem => {
        switch (ordem.tipoProduto) {
            case 1:
                estoquePorTipo.padrao += ordem.estoqueFinal;
                break;

            case 2:
                estoquePorTipo.premium += ordem.estoqueFinal;
                break;

            case 3:
                estoquePorTipo.sobEncomenda += ordem.estoqueFinal;
                break;
        }
    });

    // Média do custo total
    const somaCustos = ordens.reduce(
        (total, ordem) => total + ordem.custoTotal,
        0
    );

    const mediaCustoTotalPorOrdem =
        totalOrdens > 0
            ? somaCustos / totalOrdens
            : 0;

    // Ordem mais cara
    let ordemMaisCara = null;

    if (ordens.length > 0) {
        ordemMaisCara = ordens.reduce(
            (maior, ordem) =>
                ordem.custoTotal > maior.custoTotal
                    ? ordem
                    : maior
        );

        ordemMaisCara = {
            codigoOrdem: ordemMaisCara.codigoOrdem,
            custoTotal: ordemMaisCara.custoTotal
        };
    }

    // Ordem mais barata
    let ordemMaisBarata = null;

    if (ordens.length > 0) {
        ordemMaisBarata = ordens.reduce(
            (menor, ordem) =>
                ordem.custoTotal < menor.custoTotal
                    ? ordem
                    : menor
        );

        ordemMaisBarata = {
            codigoOrdem: ordemMaisBarata.codigoOrdem,
            custoTotal: ordemMaisBarata.custoTotal
        };
    }

    // Quantidade de alertas
    const quantidadeAlertas = {
        alto: 0,
        critico: 0,
        normal: 0
    };

    ordens.forEach(ordem => {
        switch (ordem.alertaEstoque) {
            case "ALTO":
                quantidadeAlertas.alto++;
                break;

            case "CRITICO":
                quantidadeAlertas.critico++;
                break;

            case "NORMAL":
                quantidadeAlertas.normal++;
                break;
        }
    });

    // Consolidado por produto
    const porProduto = {};

    ordens.forEach(ordem => {
        const produto = ordem.codigoProduto;

        if (!porProduto[produto]) {
            porProduto[produto] = {
                estoqueFinalConsolidado: 0,
                valorTotalInvestido: 0
            };
        }

        porProduto[produto].estoqueFinalConsolidado +=
            ordem.estoqueFinal;

        porProduto[produto].valorTotalInvestido +=
            ordem.custoTotal;
    });

    const relatorio = {
        totalOrdens,
        estoquePorTipo,
        mediaCustoTotalPorOrdem,
        ordemMaisCara,
        ordemMaisBarata,
        quantidadeAlertas,
        porProduto
    };

    return res.status(200).json(relatorio);
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});