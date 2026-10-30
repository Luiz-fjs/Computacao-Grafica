1. Jogo que será desenvolvido
O Totóbolim será inspirado no jogo brasileiro Pimbolas, utilizando como referência sua proposta de pebolim com modificadores e power-ups. 
2. Descrição do jogo
2.1. Personagens e ambiente
O Totóbolim contará com dois times adversários, cada um composto por cinco personagens humanoides tridimensionais. Os jogadores serão distribuídos em duas linhas ao longo do campo: uma linha mais próxima ao centro, composta por dois personagens, e outra mais próxima ao próprio gol, composta por três personagens.
Os personagens serão representados por modelos tridimensionais formados pela combinação de diferentes elementos geométricos, como cabeça, tronco, braços e pernas. Serão utilizadas cores e texturas para distinguir visualmente os dois times, contribuindo para a identificação dos jogadores durante a partida.
O ambiente incluirá uma mesa de jogo com campo delimitado, marcações, dois gols e uma bola. Também poderão ser incorporados elementos visuais adicionais, como suportes, bordas e detalhes decorativos, para aproximar a aparência do jogo de uma mesa de pebolim real.
2.2. Jogabilidade
O jogador controlará um dos times e deverá utilizar seus personagens para movimentar a bola em direção ao gol adversário, enquanto tenta impedir que o oponente marque pontos. A movimentação dos personagens e a interação com a bola serão os principais elementos da jogabilidade.
A proposta inicial prevê controles por teclado para movimentar as linhas de jogadores na direção do eixo que estarão presos, podendo executar ações de ataque e defesa.
Um dos principais diferenciais do jogo será a presença de três tipos de bola:
Bola normal: apresentará comportamento físico equilibrado, servindo como referência para as demais modalidades.
Bola pesada: terá maior massa simulada e responderá de maneira diferente às forças aplicadas, exigindo maior esforço para alterar sua velocidade e direção, e podendo ser usada para atordoar o adversário caso chutada na direção de sua cabeça.
Bola leve: terá menor massa simulada, permitindo mudanças de velocidade mais acentuadas diante de impulsos e colisões, mas também é maior e mais frágil, podendo estourar e atordoar a linha inteira de um jogador.
As propriedades de cada bola serão ajustadas para produzir diferenças perceptíveis durante as partidas. A escolha ou alternância entre os tipos de bola poderá modificar as estratégias de ataque e defesa, tornando cada partida mais dinâmica.
2.3. Objetivo e conclusão do jogo
O objetivo principal será marcar seis gols antes do adversário. A cada gol, o placar será atualizado e a bola será reposicionada para o reinício da partida.
Quando um dos times alcançar seis gols, a partida será encerrada e uma mensagem de vitória ou derrota será exibida, conforme o resultado.
3. Ideias iniciais das estratégias de implementação
3.1. Modelagem tridimensional
A construção dos personagens será realizada por meio da composição de primitivas geométricas, como esferas, cilindros e formas poligonais, combinadas para representar as diferentes partes do corpo. Transformações geométricas de translação, rotação e escala serão utilizadas para posicionar e movimentar os elementos.
O campo, os gols e a estrutura da mesa também serão construídos com geometrias tridimensionais. A utilização de modelos compostos permitirá criar personagens visualmente mais complexos do que objetos geométricos isolados.
3.2. Câmeras e projeção perspectiva
O jogo utilizará projeção perspectiva para representar a profundidade do ambiente tridimensional. Serão implementadas múltiplas posições de câmera, permitindo observar a partida sob diferentes ângulos.
Inicialmente, pretende-se utilizar uma câmera principal em posição elevada e inclinada na lateral do campo, que permita acompanhar o jogo inteiro, e câmeras alternativas posicionadas em ângulos diferentes, como uma visão mais próxima da ação em determinados momentos da partida.
3.3. Iluminação e texturização
Serão utilizadas múltiplas fontes de luz para destacar os personagens, a bola e os elementos do cenário. Uma fonte de luz principal poderá iluminar a mesa, enquanto fontes complementares contribuirão para reduzir áreas excessivamente escuras e destacar os volumes dos modelos.
O projeto também utilizará múltiplas texturas para aumentar o realismo visual do ambiente. Entre as possibilidades estão texturas para a superfície do campo, os uniformes dos times, a estrutura da mesa e os detalhes dos gols. As bolas poderão apresentar materiais ou texturas diferentes para facilitar a identificação de cada tipo durante a partida.
3.4. Movimentação, colisões e física
A lógica do jogo será implementada em JavaScript. A movimentação da bola será atualizada continuamente, considerando sua velocidade, direção e as colisões com os jogadores, as bordas do campo e outras superfícies.
A colisão com os personagens deverá permitir que a bola seja rebatida e tenha sua trajetória alterada. As colisões com as bordas impedirão que ela saia indevidamente da área de jogo, enquanto a detecção de entrada da bola no gol será utilizada para atualizar o placar.
Para diferenciar os três tipos de bola, serão atribuídos parâmetros físicos específicos, como massa simulada, aceleração e resistência ao movimento. Esses parâmetros serão ajustados para que cada tipo produza efeitos distintos na jogabilidade.
3.5. Controles e sistema de pontuação
Os controles serão implementados por meio de eventos de teclado, permitindo movimentar os jogadores ou suas respectivas linhas e executar ações necessárias durante a partida. A lógica de controle será integrada ao ciclo de atualização e renderização do jogo.
O sistema de pontuação manterá a quantidade de gols de cada equipe e verificará, após cada gol, se algum dos times alcançou a marca de seis pontos. Caso isso aconteça, o jogo interromperá a partida e apresentará o resultado final.
3.6. Estratégia de desenvolvimento
O desenvolvimento será realizado de forma incremental. Inicialmente, serão construídos o campo, os gols, as bolas e os personagens, com suas posições e dimensões básicas. Em seguida, serão implementados a câmera perspectiva, a iluminação e as texturas.
Nas etapas posteriores, serão desenvolvidas a movimentação dos personagens, a física simplificada da bola, a detecção de colisões e os controles. Por fim, serão incorporados os diferentes tipos de bola, o placar, as condições de vitória e os ajustes de jogabilidade.
Essa abordagem permitirá validar cada componente separadamente e reduzir a complexidade da integração entre os elementos gráficos e as mecânicas do jogo.
