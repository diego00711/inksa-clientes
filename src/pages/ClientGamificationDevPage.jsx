// Ficheiro: src/pages/ClientGamificationDevPage.jsx (PÁGINA EM CONSTRUÇÃO)

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Award, Star, Zap, Target, Gift, Wrench, Clock, Users, TrendingUp, ShoppingBag, Heart, Crown, Flame, Coins } from 'lucide-react';

export default function ClientGamificationDevPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <Wrench className="w-16 h-16 text-blue-500 animate-bounce" />
                            <div className="absolute -top-2 -right-2">
                                <div className="w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-purple-800">!</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Gamificação em Desenvolvimento
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">
                        Sistema de pontos e recompensas para clientes em construção!
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Lançamento em breve</span>
                    </div>
                </div>

                {/* Preview do que está vindo */}
                <Card className="shadow-xl mb-8">
                    <CardContent className="p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                            Funcionalidades Exclusivas para Clientes
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Sistema de Pontos */}
                            <div className="text-center p-4 bg-gradient-to-b from-blue-100 to-blue-200 rounded-lg">
                                <Coins className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-800 mb-2">Pontos por Pedidos</h3>
                                <p className="text-sm text-gray-600">
                                    Ganhe pontos a cada pedido realizado e acumule recompensas
                                </p>
                            </div>

                            {/* Níveis e Progressão */}
                            <div className="text-center p-4 bg-gradient-to-b from-purple-100 to-purple-200 rounded-lg">
                                <Crown className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-800 mb-2">Sistema de Níveis</h3>
                                <p className="text-sm text-gray-600">
                                    Evolua de nível e desbloqueie benefícios exclusivos
                                </p>
                            </div>

                            {/* Badges e Conquistas */}
                            <div className="text-center p-4 bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-lg">
                                <Award className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-800 mb-2">Badges Especiais</h3>
                                <p className="text-sm text-gray-600">
                                    Conquiste emblemas únicos por diferentes atividades
                                </p>
                            </div>

                            {/* Sequências (Streaks) */}
                            <div className="text-center p-4 bg-gradient-to-b from-orange-100 to-orange-200 rounded-lg">
                                <Flame className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-800 mb-2">Sequências de Pedidos</h3>
                                <p className="text-sm text-gray-600">
                                    Mantenha sequências ativas e ganhe bônus especiais
                                </p>
                            </div>

                            {/* Loja de Recompensas */}
                            <div className="text-center p-4 bg-gradient-to-b from-green-100 to-green-200 rounded-lg">
                                <Gift className="w-12 h-12 text-green-600 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-800 mb-2">Loja de Recompensas</h3>
                                <p className="text-sm text-gray-600">
                                    Troque pontos por descontos, frete grátis e brindes
                                </p>
                            </div>

                            {/* Ranking de Clientes */}
                            <div className="text-center p-4 bg-gradient-to-b from-red-100 to-red-200 rounded-lg">
                                <Trophy className="w-12 h-12 text-red-600 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-800 mb-2">Ranking Mensal</h3>
                                <p className="text-sm text-gray-600">
                                    Compete com outros clientes e apareça no top 10
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Funcionalidades específicas para clientes */}
                <Card className="shadow-lg mb-8">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
                            <ShoppingBag className="w-6 h-6 text-blue-500" />
                            Recursos Especiais para Clientes
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                    <span className="text-sm font-medium">Pontos por Avaliações</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Heart className="w-5 h-5 text-red-500" />
                                    <span className="text-sm font-medium">Programa de Fidelidade</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-500" />
                                    <span className="text-sm font-medium">Indique Amigos</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Target className="w-5 h-5 text-green-500" />
                                    <span className="text-sm font-medium">Metas Personalizadas</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Zap className="w-5 h-5 text-purple-500" />
                                    <span className="text-sm font-medium">Eventos Especiais</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-orange-500" />
                                    <span className="text-sm font-medium">Estatísticas Pessoais</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tipos de Recompensas */}
                <Card className="shadow-lg mb-8">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                            Recompensas Disponíveis
                        </h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-2xl mb-2">💰</div>
                                <span className="text-sm font-medium">Descontos</span>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="text-2xl mb-2">🚚</div>
                                <span className="text-sm font-medium">Frete Grátis</span>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <div className="text-2xl mb-2">🍰</div>
                                <span className="text-sm font-medium">Sobremesas</span>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                <div className="text-2xl mb-2">🎁</div>
                                <span className="text-sm font-medium">Brindes</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Progresso simulado */}
                <Card className="shadow-lg mb-8">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                            Progresso de Desenvolvimento
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Sistema de Pontos */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Sistema de Pontos</span>
                                    <span className="text-sm text-green-600">85%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                                </div>
                            </div>

                            {/* Badges e Conquistas */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Badges e Conquistas</span>
                                    <span className="text-sm text-blue-600">75%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                                </div>
                            </div>

                            {/* Loja de Recompensas */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Loja de Recompensas</span>
                                    <span className="text-sm text-purple-600">60%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                                </div>
                            </div>

                            {/* Interface do Cliente */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Interface do Cliente</span>
                                    <span className="text-sm text-yellow-600">45%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                                </div>
                            </div>

                            {/* Testes e Integração */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Testes e Integração</span>
                                    <span className="text-sm text-orange-600">30%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Mensagem motivacional */}
                <Card className="shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <CardContent className="p-6 text-center">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-blue-100" />
                        <h3 className="text-xl font-bold mb-2">Continue pedindo conosco!</h3>
                        <p className="text-blue-100">
                            Continue fazendo seus pedidos e avaliando os restaurantes. Quando o sistema de gamificação estiver pronto, 
                            você receberá pontos retroativos baseados no seu histórico de pedidos e avaliações!
                        </p>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center mt-8 text-gray-500 text-sm">
                    <p>🏆 Em breve: Sistema completo de gamificação para clientes Inksa Delivery</p>
                </div>
            </div>
        </div>
    );
}
